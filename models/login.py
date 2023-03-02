import json

import requests
from odoo import models, fields, api
import logging

_logger = logging.getLogger(__name__)


class EDSLogin(models.Model):
    _name = 'eds.login'
    _description = "EDS SING IN"

    # @api.model
    # def eds_login(self):
    #     signdata = {
    #         "version": "2.0",
    #         "method": "cms.sign",
    #         "params": {
    #             "withTsp": True,
    #             "data": self.report_request.decode('utf-8'),
    #             "p12array": [
    #                 {
    #                     "alias": "",
    #                     "p12": self.env.user.p12_digital_signature.decode('utf-8'),
    #                     "password": passwd
    #                 }
    #             ]
    #         },
    #     }
    #     res = requests.post(
    #         "http://172.17.0.1:14579",
    #         json.dumps(signdata),
    #         headers={"Content-type": "application/json"},
    #     )
    #     _logger.error(res.status_code)

