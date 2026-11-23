# Ativar a lista compartilhada (Firebase)

Leva uns 10 minutos e pode ser feito pelo navegador do celular ou do PC. O plano gratuito do Firebase (Spark) é suficiente e não pede cartão.

## 1. Criar o projeto
1. Acesse https://console.firebase.google.com e entre com a conta Google (de preferência a da LIVREZON).
2. Toque em **Criar um projeto** (ou **Adicionar projeto**).
3. Nome: `mercado-livrezon`, ou outro de sua preferência. Continue.
4. **Google Analytics:** pode desativar. Toque em **Criar projeto** e aguarde.

## 2. Ativar o login anônimo
O usuário não vê nenhuma tela de login. O login anônimo só identifica o aparelho para o banco.
1. No menu, vá em **Criação → Authentication** e toque em **Vamos começar**.
2. Na aba **Método de login**, escolha **Anônimo**, ative e toque em **Salvar**.
3. Na aba **Configurações → Domínios autorizados**, toque em **Adicionar domínio** e informe `eder8928.github.io`.

## 3. Criar o banco (Firestore)
1. No menu, vá em **Criação → Firestore Database** e toque em **Criar banco de dados**.
2. Local: **southamerica-east1 (São Paulo)**. Esse local não pode ser trocado depois.
3. Escolha **Iniciar no modo de produção** e toque em **Criar**.
4. Abra a aba **Regras**, apague o texto que estiver lá, cole o conteúdo do arquivo `firestore.rules` deste repositório e toque em **Publicar**.

## 4. Registrar o app web e copiar a configuração
1. Toque na engrenagem ⚙️ e depois em **Configurações do projeto**.
2. Em **Seus apps**, toque no ícone **Web `</>`**.
3. Apelido: `mercado-pwa`. **Não** marque o Firebase Hosting. Toque em **Registrar app**.
4. Copie o bloco `const firebaseConfig = { ... }`, com `apiKey`, `authDomain`, `projectId` etc., e envie para o Claude.

> Essa configuração não é senha: ela fica visível no app de qualquer forma. Quem protege os dados são as regras do passo 3.

## 5. Publicação (feita pelo Claude)
- Preencher `firebase-config.js` com a configuração.
- Juntar o ramo `compartilhar` na `main` e publicar no `gh-pages`.
- No celular: feche o app pela lista de recentes e abra de novo.

## Como usar
1. Abra uma lista e toque em **👥 Compartilhar lista (comprar junto)**.
2. Informe seu nome uma vez (ele aparece para quem compra junto).
3. Envie o link pelo WhatsApp. Quem abrir o link entra na mesma lista.
4. Cada pessoa marca ✓, escaneia e digita preços. Tudo aparece para todos em segundos, e o **total do carrinho** soma o de todos.
5. Quando alguém tocar em **Finalizar compra**, a compra vai para o histórico de todos os participantes.

## Depois, para a versão LIVREZON (pendente)
- Restringir a chave de API ao domínio do app no Google Cloud Console.
- Ativar o App Check.
- Criar uma limpeza automática de listas antigas.
- Criar política de privacidade e termos de uso (LGPD).
