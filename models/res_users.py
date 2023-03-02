from OpenSSL.crypto import FILETYPE_ASN1
from OpenSSL import crypto
import logging
import re

from odoo import models, fields, api

from odoo import SUPERUSER_ID
from odoo.exceptions import AccessDenied
from odoo.http import request
import pytz
_logger = logging.getLogger(__name__)


class ResUsers(models.Model):
    _inherit = 'res.users'

    # esp_public_key = fields.Binary(string="Public Key ESP")
    iin = fields.Char(string="IIN")
    _sql_constraints = [
        ('iin_unique', 'UNIQUE (iin)', 'You can not have two users with the same iin !')
    ]

    @classmethod
    def authenticate(cls, db, login, password, user_agent_env):
        """Verifies and returns the user ID corresponding to the given
          ``login`` and ``password`` combination, or False if there was
          no matching user.
           :param str db: the database on which user is trying to authenticate
           :param str login: username
           :param str password: user password
           :param dict user_agent_env: environment dictionary describing any
               relevant environment attributes
        """
        uid = None
        if type(login) is not bytes:
            uid = cls._login(db, login, password, user_agent_env=user_agent_env)
        elif type(login) is bytes:
            uid = cls._login_esp(db, login, user_agent_env=user_agent_env)
        if user_agent_env and user_agent_env.get('base_location'):
            with cls.pool.cursor() as cr:
                env = api.Environment(cr, uid, {})
                if env.user.has_group('base.group_system'):
                    # Successfully logged in as system user!
                    # Attempt to guess the web base url...
                    try:
                        base = user_agent_env['base_location']
                        ICP = env['ir.config_parameter']
                        if not ICP.get_param('web.base.url.freeze'):
                            ICP.set_param('web.base.url', base)
                    except Exception:
                        _logger.exception("Failed to update web.base.url configuration parameter")
        return uid

    @api.model
    def _get_iin_domain(self, iin):
        print(iin)
        return [('iin', '=', iin)]

    @classmethod
    def _login_esp(cls, db, xml_certificate, user_agent_env):
        ip = request.httprequest.environ['REMOTE_ADDR'] if request else 'n/a'
        try:
            with cls.pool.cursor() as cr:
                self = api.Environment(cr, SUPERUSER_ID, {})[cls._name]
                with self._assert_can_auth():
                    if not xml_certificate:
                        raise AccessDenied()
                    try:
                        certificate = crypto.load_certificate(FILETYPE_ASN1, xml_certificate)
                        iin = str(certificate.get_subject().get_components()[2][1], encoding='utf-8')
                        iin = re.findall(r"IIN([1-9]\d*)", iin)[0]
                    except:
                        raise AccessDenied()
                    user = self.search([('iin', '=', iin)], order=self._get_login_order(), limit=1)
                    if not user:
                        raise AccessDenied()
                    user = user.with_user(user)
                    # pass password _check_credentials because we got check with IIN
                    # user._check_credentials(password, user_agent_env)
                    tz = request.httprequest.cookies.get('tz') if request else None
                    if tz in pytz.all_timezones and (not user.tz or not user.login_date):
                        # first login or missing tz -> set tz to browser tz
                        user.tz = tz
                    user._update_last_login()
        except AccessDenied:
            _logger.info("Login failed for db:%s from %s", db, ip)
            raise

        _logger.info("Login successful for db:%s from %s", db, ip)

        return user.id

    @api.model
    def _get_iin_domain(self, iin):
        return self.env['res.users'].search([('iin', '=', iin)],limit=1)