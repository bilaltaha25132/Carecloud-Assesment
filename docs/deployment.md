# Deployment (self-contained server stack)

This deploys CareCloud onto an existing Ubuntu server that already runs nginx +
certbot, without touching anything else on it. Everything lives in one Compose
stack and one nginx file, so removal is a few commands.

Ports used: the API and console bind only to `127.0.0.1:4100` and `:4101`;
Postgres is internal to the stack. nginx is the only public entry point.

## 1. DNS

Add two A records pointing at the server's public IP:

```
carecloud.<your-domain>       A   <server-ip>
carecloud-api.<your-domain>   A   <server-ip>
```

## 2. Bring up the stack

```bash
sudo mkdir -p /opt/carecloud && sudo chown "$USER" /opt/carecloud
git clone https://github.com/bilaltaha25132/Carecloud-Assesment.git /opt/carecloud
cd /opt/carecloud/deploy
cp .env.example .env
nano .env            # fill in every value (see below)
docker compose up -d --build
curl -s localhost:4100/health     # {"data":{"status":"ok",...}}
```

`.env` values:

| Variable | Value |
|---|---|
| `PUBLIC_BASE_URL` | `https://carecloud-api.<your-domain>` |
| `POSTGRES_PASSWORD` | any strong string |
| `OPENAI_API_KEY` | your OpenAI key |
| `VAPI_API_KEY` | your Vapi private key |
| `VAPI_WEBHOOK_SECRET` | a random 16+ char string |
| `ADMIN_API_KEY` | a random string (console uses it for `/admin/*`) |
| `APP_USERNAME` / `APP_PASSWORD` | console login |
| `SESSION_SECRET` | a long random string |

## 3. nginx + TLS

```bash
sudo cp /opt/carecloud/deploy/nginx-carecloud.conf /etc/nginx/sites-available/carecloud.conf
sudo sed -i 's/CONSOLE_DOMAIN/carecloud.<your-domain>/; s/API_DOMAIN/carecloud-api.<your-domain>/' \
  /etc/nginx/sites-available/carecloud.conf
sudo ln -s /etc/nginx/sites-available/carecloud.conf /etc/nginx/sites-enabled/carecloud.conf
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d carecloud.<your-domain> -d carecloud-api.<your-domain>
```

certbot adds the TLS blocks and the 80→443 redirect.

## 4. Point Vapi at the new URL

From anywhere with the backend repo and the same Vapi + OpenAI keys, set
`PUBLIC_BASE_URL=https://carecloud-api.<your-domain>` in `backend/.env` and run
`npm run vapi:sync`, or run it inside the container:

```bash
docker compose exec api npm run vapi:sync
```

It prints the phone number. Update it in the README.

## 5. Verify

- `curl https://carecloud-api.<your-domain>/health`
- Open `https://carecloud.<your-domain>` and sign in.
- Call the phone number and register a patient.

## Teardown (leaves no trace)

```bash
cd /opt/carecloud/deploy && docker compose down -v
sudo rm /etc/nginx/sites-enabled/carecloud.conf /etc/nginx/sites-available/carecloud.conf
sudo systemctl reload nginx
sudo certbot delete --cert-name carecloud.<your-domain>   # optional
sudo rm -rf /opt/carecloud
```

Then remove the two DNS records. Nothing of this app remains on the server.
