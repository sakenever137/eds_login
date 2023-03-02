import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import odoo
import werkzeug
import base64
from bs4 import BeautifulSoup as bs
from OpenSSL.crypto import FILETYPE_ASN1
from OpenSSL import crypto
import logging
import re
from cryptography.hazmat.primitives.serialization import pkcs12 as crypt
import string
import secrets
from odoo import api, http, SUPERUSER_ID, _
from odoo.http import request
from odoo import registry as registry_get
from odoo.addons.auth_signup.controllers.main import AuthSignupHome as SHome
from odoo.addons.web.controllers.main import db_monodb, ensure_db, set_cookie_and_redirect, login_and_redirect
from odoo import http, tools, _
from odoo.addons.auth_signup.models.res_users import SignupError
from odoo.addons.web.controllers.main import ensure_db, Home, SIGN_UP_REQUEST_PARAMS
from odoo.addons.base_setup.controllers.main import BaseSetup
from odoo.exceptions import UserError
from validate_email import validate_email

SIGN_UP_REQUEST_PARAMS = {'db', 'login', 'debug', 'token', 'message', 'error', 'scope', 'mode',
                          'redirect', 'redirect_hostname', 'email', 'name', 'partner_id',
                          'password', 'confirm_password', 'city', 'country_id', 'lang','iin'}
_logger = logging.getLogger(__name__)


class LoginESP(Home):
    @http.route('/web/login_esp', type='http', auth="public", website=True, sitemap=False)
    def _open_login_esp(self, redirect=None, **kw):
        ensure_db()
        certificate = None
        if 'certificate' in request.params:
            content = bs(request.params['certificate'], features="xml")
            X509Certificate = content.find("ds:X509Certificate").text
            X509Certificate = ''.join(X509Certificate.split())
            certificate = base64.b64decode(X509Certificate)
        request.params['login_success'] = False
        if request.httprequest.method == 'GET' and redirect and request.session.uid:
            return request.redirect(redirect)

        if not request.uid:
            request.uid = odoo.SUPERUSER_ID

        values = {k: v for k, v in request.params.items() if k in SIGN_UP_REQUEST_PARAMS}
        try:
            values['databases'] = http.db_list()
        except odoo.exceptions.AccessDenied:
            values['databases'] = None
        if request.httprequest.method == 'POST':
            old_uid = request.uid
            try:
                uid = request.session.authenticate(request.session.db,certificate,password=None)
                request.params['login_success'] = True
                return request.redirect(self._login_redirect(uid, redirect=redirect))
            except odoo.exceptions.AccessDenied as e:
                request.uid = old_uid
                if e.args == odoo.exceptions.AccessDenied().args:
                    values['error'] = _("Wrong login/password")
                else:
                    values['error'] = e.args[0]
        else:
            if 'error' in request.params and request.params.get('error') == 'access':
                values['error'] = _('Only employees can access this database. Please contact the administrator.')

        response = request.render('eds_login.login_esp', values)
        response.headers['X-Frame-Options'] = 'DENY'
        return response


class AuthESP(SHome):
    @http.route('/web/signup_eds', type='http', auth='public', website=True, sitemap=False)
    def web_auth_signup_eds(self, *args, **kw):
        certificate = None
        if 'certificate' in request.params:
            try:
                content = bs(request.params['certificate'], features="xml")
                X509Certificate = content.find("ds:X509Certificate").text
                X509Certificate = ''.join(X509Certificate.split())
                certificate = base64.b64decode(X509Certificate)
                certificate = crypto.load_certificate(FILETYPE_ASN1, certificate)
                symbols = ['*', '%', '£']  # Can add more
                password = ""
                for _ in range(9):
                    password += secrets.choice(string.ascii_lowercase)
                    password += secrets.choice(string.ascii_uppercase)
                    password += secrets.choice(string.digits)
                    password += secrets.choice(symbols)
                request.params["password"]=password
                request.params["confirm_password"]=password
                iin = re.findall(r"IIN([1-9]\d*)",str(certificate.get_subject().get_components()[2][1], encoding='utf-8'))[0]
                request.params["iin"]=iin
                name = str(certificate.get_subject().get_components()[0][1],encoding='utf-8')
                request.params["name"]=name
            except Exception as e:
                request.params["error"]=("PLS Choice EDS key", e)


        qcontext = self.get_auth_signup_qcontext_eds()

        if not qcontext.get('token') and not qcontext.get('signup_enabled'):
            raise werkzeug.exceptions.NotFound()
        if 'login' in request.params:
            if not request.params['login']:
                qcontext['error'] = 'Signup: no login given for new user'
            elif validate_email(request.params['login']) is False:
                qcontext['error'] = 'Signup: The email address is not valid.'

        if 'error' not in qcontext and request.httprequest.method == 'POST':
            try:
                User_iin = request.env['res.users']
                user_iin = User_iin.sudo()._get_iin_domain(qcontext.get('iin'))
                if user_iin['iin'] != qcontext.get('iin'):
                    self.do_signup(qcontext)
                    User = request.env['res.users']
                    user_sudo = User.sudo().search(
                        User._get_login_domain(qcontext.get('login')), order=User._get_login_order(), limit=1
                    )
                    user_sudo["iin"] = qcontext.get('iin')
                    self.send_passowrd_to_mail(qcontext)
                    # Send an account creation confirmation email
                    if qcontext.get('token'):
                        User = request.env['res.users']
                        user_sudo = User.sudo().search(
                            User._get_login_domain(qcontext.get('login')), order=User._get_login_order(), limit=1
                        )
                        template = request.env.ref('auth_signup.mail_template_user_signup_account_created',
                                                   raise_if_not_found=False)
                        if user_sudo and template:
                            template.sudo().send_mail(user_sudo.id, force_send=True)
                    return self.web_login(*args, **kw)
                else:
                    qcontext["error"] = ("Another user is already registered using this IIN.")
            except UserError as e:
                qcontext['error'] = e.args[0]
            except (SignupError, AssertionError) as e:
                if request.env["res.users"].sudo().search([("login", "=", qcontext.get("login"))]):
                    qcontext["error"] = ("Another user is already registered using this email address.")
                else:
                    _logger.error("%s", e)
                    qcontext['error'] = ("Could not create a new account.")
        response = request.render('eds_login.signup_eds', qcontext)
        response.headers['X-Frame-Options'] = 'DENY'
        return response

    def get_auth_signup_qcontext_eds(self):
        """ Shared helper returning the rendering context for signup and reset password """
        qcontext = {k: v for (k, v) in request.params.items() if k in SIGN_UP_REQUEST_PARAMS}
        qcontext.update(self.get_auth_signup_config())
        if not qcontext.get('token') and request.session.get('auth_signup_token'):
            qcontext['token'] = request.session.get('auth_signup_token')
        if qcontext.get('token'):
            try:
                # retrieve the user info (name, login or email) corresponding to a signup token
                token_infos = request.env['res.partner'].sudo().signup_retrieve_info(qcontext.get('token'))
                for k, v in token_infos.items():
                    qcontext.setdefault(k, v)
            except:
                qcontext['error'] = _("Invalid signup token")
                qcontext['invalid_token'] = True
        return qcontext

    def send_passowrd_to_mail(self,qcontext):
        from_address = "sakenever137@gmail.com"
        to_address = qcontext.get('login')
        # Create message container - the correct MIME type is multipart/alternative.
        msg = MIMEMultipart('alternative')
        msg['Subject'] = 'Hello '+qcontext.get('name')+" This is your password Kaznedra"
        msg['From'] = from_address
        msg['To'] = to_address

        # Create the message (HTML).
        html = 'Hello '+qcontext.get('name')+". This is your login "+qcontext.get('login')+" and this is password  "+qcontext.get('password')

        # Record the MIME type - text/html.
        part1 = MIMEText(html, 'html')

        # Attach parts into message container
        msg.attach(part1)

        # Credentials
        username = 'your@gmail.com'
        password = 'password'

        # Sending the email
        ## note - this smtp config worked for me, I found it googling around, you may have to tweak the # (587) to get yours to work
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.ehlo()
        server.starttls()
        server.login(username, password)
        server.sendmail(from_address, to_address, msg.as_string())
        server.quit()
        return print("Sended to mail password")

    @http.route('/web/login_digital_id', type='http', auth="public", website=True, sitemap=False)
    def _open_digital_id(self, redirect=None, **kw):
        ensure_db()
        values = {k: v for k, v in request.params.items() if k in SIGN_UP_REQUEST_PARAMS}

        response = request.render('eds_login.login_digital_id', values)
        response.headers['X-Frame-Options'] = 'DENY'
        return response