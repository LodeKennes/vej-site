# Vej website

Public website: https://itsvej.com

Vej builds Pea, Pepper and Pumpkin. Pea is a 2B model offering text decisions and
hosted Beta extraction at `/v1beta/extract`. Pea is available through console signup
and manual approval. Pea 1 decision weights have a separate Hugging Face access
request; extraction weights are private. Pepper (8B) and Pumpkin (27B) are in private
development and unavailable for public use. Only Pea decisions have published evaluation
results; extraction reports development results on locked test documents.

This repository contains the generated website, not model weights or datasets.
The build manifest identifies the source revision. Hosted Pea access starts at
https://app.itsvej.com/sign-up. Every new console account needs manual admin approval;
people can sign in and enroll a passkey or authenticator app while waiting. API keys
authenticate API clients, not console sign-in. Pea 1 decision weights have a separate
Hugging Face access request; extraction weights are private.

Pepper and Pumpkin waitlists, the newsletter and the contact form remain on the
website. Their records use forms.itsvej.com and a private EU Cloudflare D1 database
managed by the separate infrastructure repo; they do not create console accounts
or grant API access. Contact messages are stored so Vej can reply.

Contact: https://itsvej.com/contact/
