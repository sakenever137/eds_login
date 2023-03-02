import base64
from OpenSSL.crypto import FILETYPE_ASN1
from bs4 import BeautifulSoup as bs
from OpenSSL import crypto
xml_certificate='''<?xml version="1.0" encoding="UTF-8" standalone="no"?><login><timeTicket>1663666507194</timeTicket><sessionid>ee47e162-98d2-495c-b5b4-17080d78a929</sessionid><ds:Signature xmlns:ds="http://www.w3.org/2000/09/xmldsig#">
<ds:SignedInfo>
<ds:CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"/>
<ds:SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#rsa-sha256"/>
<ds:Reference URI="">

<ds:Transforms>
<ds:Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"/>
<ds:Transform Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315#WithComments"/>
</ds:Transforms>
<ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/>
<ds:DigestValue>lYE0yIdC1HGSzlhgIUT9AaFjHUjzUOKGV6MvmPwOIlM=</ds:DigestValue>
</ds:Reference>
</ds:SignedInfo>
<ds:SignatureValue>
U55O5qGSMr2ZFXapuL0F8bu3nh27uam3IfGAd8QzoRAdN6vSwAVrrLdZoHQtjA/1GEWsRhBQKO21
Dehi13lpOp3VsgLtqNRYWPVzzbC5D24ek49V7HxGjki48tST1pFyDjwKMbybJAm9paDR97gktQxh
ZRGSgVCTUac4gDUFpeJmUYrU56w+9YjLiOmZM92T8qcvjzI3ebNMW+SI6ZjXgQjWTy4Pq3p51l6J
dOHJtwmaDNcZj7LtFm66IyLf6bKcV8JyjblsihtaqRevpjm3xcoYlwPRNCwG9+niQAW5DhV6uq9w
vmkgnFIcSdkGnREEEEKJZkZqav4thb48luBfpw==
</ds:SignatureValue>
<ds:KeyInfo>
<ds:X509Data>
<ds:X509Certificate>
MIIGWTCCBEGgAwIBAgIUeybLJynQWG7rWw5cP5gQL8zXXO8wDQYJKoZIhvcNAQELBQAwUjELMAkG
A1UEBhMCS1oxQzBBBgNVBAMMOtKw0JvQotCi0KvSmiDQmtCj05jQm9CQ0J3QlNCr0KDQo9Co0Ksg
0J7QoNCi0JDQm9Cr0pogKFJTQSkwHhcNMjIwMjA5MDY0NjM4WhcNMjMwMjA5MDY0NjM4WjCBmzEw
MC4GA1UEAwwn0JrQo9Co0JXQmtCR0JDQldCS0JAg0KjQkNCc0KjQkNCT0KPQm9CsMR0wGwYDVQQE
DBTQmtCj0KjQldCa0JHQkNCV0JLQkDEYMBYGA1UEBRMPSUlONTgwODE1NDAzMDMwMQswCQYDVQQG
EwJLWjEhMB8GA1UEKgwY0JHQldCa0JzQo9Cg0JfQq9CV0JLQndCQMIIBIjANBgkqhkiG9w0BAQEF
AAOCAQ8AMIIBCgKCAQEAj+rnv1UKSq4mlb+ksl3IwzWst+pugT0CJ83KBNj0WqI06XmGu2kYcopi
g8FxpeAmVi6qo40qBMfbA193057RCLdbcmja3jnKqlUyqHLMHP3wuGTumroL7X+LA3PnmRbs8qjb
J6LK58hwT3rs4o8dgzOfLr5tFNb+44Im3Nm5Rl0WRES/IKWu4Wl1DrL4TwPUOy/lQ8LCa5RwFjwM
ELmBQnZVx2Wy+iwZ3jy3MSJX6+nPmQPGDi78FeRVw8S9af0qcnzJRR03wWhbkgs5svxlrPFGpfXp
nRIRezXrYUFZ5zmv3D9CmvM8X4cbzVh8EKFNZg2w+51LsbUc6kWgqJ+CMQIDAQABo4IB2zCCAdcw
DgYDVR0PAQH/BAQDAgWgMB0GA1UdJQQWMBQGCCsGAQUFBwMCBggqgw4DAwQBATAPBgNVHSMECDAG
gARbanQRMB0GA1UdDgQWBBRgRbmB36BXWKo7poVBolY7PzD9jzBeBgNVHSAEVzBVMFMGByqDDgMD
AgQwSDAhBggrBgEFBQcCARYVaHR0cDovL3BraS5nb3Yua3ovY3BzMCMGCCsGAQUFBwICMBcMFWh0
dHA6Ly9wa2kuZ292Lmt6L2NwczBWBgNVHR8ETzBNMEugSaBHhiFodHRwOi8vY3JsLnBraS5nb3Yu
a3ovbmNhX3JzYS5jcmyGImh0dHA6Ly9jcmwxLnBraS5nb3Yua3ovbmNhX3JzYS5jcmwwWgYDVR0u
BFMwUTBPoE2gS4YjaHR0cDovL2NybC5wa2kuZ292Lmt6L25jYV9kX3JzYS5jcmyGJGh0dHA6Ly9j
cmwxLnBraS5nb3Yua3ovbmNhX2RfcnNhLmNybDBiBggrBgEFBQcBAQRWMFQwLgYIKwYBBQUHMAKG
Imh0dHA6Ly9wa2kuZ292Lmt6L2NlcnQvbmNhX3JzYS5jZXIwIgYIKwYBBQUHMAGGFmh0dHA6Ly9v
Y3NwLnBraS5nb3Yua3owDQYJKoZIhvcNAQELBQADggIBAE9u3A7EwK0ksRXB+yFI2F61HUQTIl+2
k/LXxi+6ZzI61fcfbJJCbW3WVrdikqUwJbMkQXdLq0ecG+u3otmB1aeTbANDfLOADdcGFAnN3bF+
Y6pA2bnBI7/1Fl9qhlBtMaUioV0PzO4wtaGNG4M1uKf1I4uavwYGqXrMmGv4W5kxc3F2GqIlQk5F
WR988/0UWlil4IipNCsvFW2V4hFp8S2c5TKwnCJERZ0NC7wt1BT7Cmgoeh6d8sPYUhXxb4DsPOZx
8RA25Y4sOIp6FMUw1vRKz2/g8K8Y/RjYZvANiKemv7m/d8aVAFjGH4701HBm69TL5mXaJyGIVwu+
qJOq2MaiAp7VTHWIqzGiyKI72XaP3Ocjt7FWDHUhCuzikMYiaeSUdWP37kmKRIxTjER2BYJp/XE9
Nza+bNeSLIKTHRlVfIdSBP30MZgWFjrIH0dU6cZ2qfB8ZqOeIZboaxYvmyZNPrYZ4SojOM+CqsSg
aCvD8QFddIJy9UOsRKx9VTB6Hxq+/0UngXwTn3pE+7/qJIUjlgopePZtmwTBhlTHl1M4uJOSkbRp
wDLL3noWy4qy3ZmcfNk+b5uA99r+dxOIgBj4LZ7pWCnEW3LeY4e+9PPgpR5/EMnMgJCc3lzbEcgs
yimERA7R++849tPEkIhEJimEJOOzSRAuNlys6ZIXTBQ1
</ds:X509Certificate>
</ds:X509Data>
</ds:KeyInfo>
</ds:Signature></login>'''
content = bs(xml_certificate, features="xml")
X509Certificate = content.find("ds:X509Certificate").text
X509Certificate = ''.join(X509Certificate.split())
decoded_cert = base64.b64decode(X509Certificate)
certificate = crypto.load_certificate(FILETYPE_ASN1,decoded_cert)
iin = str(certificate.get_subject().get_components()[0][1],encoding='utf-8')
print(iin)
