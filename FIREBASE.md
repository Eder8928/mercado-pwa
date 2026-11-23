# Configuração do Firebase e do domínio — Minha Lista de Mercado

Desenvolvido por Eder Rodrigues — LIVREZON TECNOLOGIA

Leva cerca de 15 minutos pelo navegador. O plano gratuito do Firebase (Spark) é suficiente e não pede cartão.

## 1. Criar o projeto
1. Acesse https://console.firebase.google.com com a conta Google da LIVREZON.
2. Toque em **Criar um projeto**. Nome: `mercado-livrezon`. O Google Analytics pode ficar desativado.

## 2. Authentication (login)
1. Vá em **Criação → Authentication → Vamos começar**.
2. Em **Método de login**, ative **Anônimo**. É usado pelo app, e o usuário não vê nenhuma tela de login.
3. Ainda em **Método de login**, ative **Google**. É usado somente pelo Painel Master. Informe o e-mail de suporte (contato@livrezon.com.br) e salve.
4. Em **Configurações → Domínios autorizados**, adicione `eder8928.github.io` e `mercado.livrezon.com.br`.
5. Ative a **verificação em duas etapas**, de preferência com chave de segurança ou passkey, na conta Google que será a do Master (myaccount.google.com → Segurança).

## 3. Firestore (banco)
1. Vá em **Criação → Firestore Database → Criar banco de dados**.
2. Local: **southamerica-east1 (São Paulo)**. O local não pode ser trocado depois.
3. Escolha **Modo de produção** e toque em **Criar**.
4. Na aba **Regras**, cole o conteúdo de `firestore.rules`, **trocando `MASTER_EMAIL_AQUI` pelo e-mail Google do Master**, e toque em **Publicar**.
5. **Não** crie política de TTL. No plano gratuito (Spark), o TTL exige faturamento ativado e o console responde com erro 403. A exclusão das listas expiradas é feita pelo **Painel Master → Visão geral → Limpar listas expiradas**, pelo menos uma vez a cada 12 meses (listas expiram 30 dias após finalizar ou 120 dias sem uso).

## 4. Registrar o app web
1. Vá em ⚙️ **Configurações do projeto → Seus apps → Web `</>`**.
2. Apelido: `mercado-pwa`. **Não** marque o Firebase Hosting. Toque em **Registrar app**.
3. Copie o bloco `firebaseConfig` e envie para o Claude, junto com o e-mail Google do Master.

## 5. Segurança extra (recomendado)
- No Google Cloud Console → **APIs e serviços → Credenciais**, abra a chave "Browser key" e restrinja por **referenciadores HTTP**: `https://mercado.livrezon.com.br/*` e `https://eder8928.github.io/*`.
- Em **Firebase → Uso e faturamento**, mantenha o plano Spark. Ele não gera cobrança: ao atingir a cota gratuita, o serviço só pausa.

## 6. Domínio mercado.livrezon.com.br
1. No painel DNS do domínio `livrezon.com.br`, crie um registro **CNAME** com nome `mercado` e valor `eder8928.github.io`.
2. Avise o Claude. Ele adiciona o arquivo `CNAME` ao site.
3. No GitHub (pelo navegador), entre em **Settings → Pages**, aguarde o certificado e marque **Enforce HTTPS**.
4. Depois disso, o endereço antigo `eder8928.github.io/mercado-pwa` passa a redirecionar para o novo. Os dados locais não mudam de endereço sozinhos: para levar, use Opções → Copiar backup no endereço antigo e Colar backup no novo.

## Arquivos
| Arquivo | Para quê |
|---|---|
| `firebase-config.js` | Configuração do Firebase e e-mail(s) do Master |
| `firestore.rules` | Regras de segurança do banco |
| `master.html` | Painel Master (`/master`) |
| `privacidade.html` / `termos.html` | Política de Privacidade e Termos de Uso (LGPD) |
