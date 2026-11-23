// Minha Lista de Mercado — LIVREZON TECNOLOGIA
// Configuração do Firebase (lista compartilhada e Painel Master).
// Enquanto FIREBASE_CONFIG estiver null, o app funciona normalmente, só sem o compartilhamento.
// Essa configuração não é segredo: quem protege os dados são as regras do firestore.rules.
window.FIREBASE_CONFIG = null;
// Conta(s) Google com Acesso Master (precisa ser a mesma lista do firestore.rules).
window.MASTER_EMAILS = [];
