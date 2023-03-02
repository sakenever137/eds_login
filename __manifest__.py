# -*- coding: utf-8 -*-
{
    'name': "EDS Login",
    'summary': """""",
    'description': """
    """,
    'author': "Saken Serdaly",
    'website': "http://www.yourcompany.com",
    # Categories can be used to filter modules in modules listing
    'category': "Login",
    'version': "0,1",
    # any module necessary for this one to work correctly
    'depends': ['auth_signup'],
    # always loaded
    'data': [
        'security/ir.model.access.csv',
        'views/res_users.xml',
        'views/login_esp.xml',
        'views/signup.xml',
    ],
    'auto_install': True,
}
