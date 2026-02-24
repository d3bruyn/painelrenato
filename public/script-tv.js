// ========================
// Relógio e Saudação
// ========================
function atualizarHora() {
  const agora = new Date();
  const horas = agora.getHours().toString().padStart(2, "0");
  const minutos = agora.getMinutes().toString().padStart(2, "0");
  const segundos = agora.getSeconds().toString().padStart(2, "0");

  // Atualiza o relógio em tempo real
  document.getElementById("hora").textContent = `${horas}:${minutos}:${segundos}`;

  // Saudação automática
  const saudacaoEl = document.getElementById("saudacao");
  if (agora.getHours() < 12) saudacaoEl.textContent = "☀️ Bom dia!";
  else if (agora.getHours() < 18) saudacaoEl.textContent = "🌤️ Boa tarde!";
  else saudacaoEl.textContent = "🌙 Boa noite!";
}

setInterval(atualizarHora, 1000);
atualizarHora();


// ========================
// Dia atual
// ========================
const dias = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"];
const diaAtual = dias[new Date().getDay()];


// ========================
// Cardápio (matutino e vespertino)
// ========================
async function carregarCardapio() {
  try {
    const res = await fetch(`/api/cardapio/${diaAtual}`);
    const data = await res.json();

    document.getElementById("cardapioMatutino").textContent =
      data.matutino || "Sem cardápio cadastrado.";

    document.getElementById("cardapioVespertino").textContent =
      data.vespertino || "Sem cardápio cadastrado.";
  } catch (error) {
    console.error("Erro ao carregar cardápio:", error);
    document.getElementById("cardapioMatutino").textContent = "Erro ao carregar.";
    document.getElementById("cardapioVespertino").textContent = "Erro ao carregar.";
  }
}

carregarCardapio();
setInterval(carregarCardapio, 30 * 60 * 1000); // Atualiza a cada 30 min


// ========================
// Imagens rotativas com transição suave (crossfade)
// ========================
let imagens = [];
let indexAtual = 0;

const painel = document.querySelector(".painel-imagens");

// Criamos dois elementos de imagem para o efeito
const img1 = document.createElement("img");
const img2 = document.createElement("img");

img1.classList.add("imagem-tv", "ativa");
img2.classList.add("imagem-tv");

painel.appendChild(img1);
painel.appendChild(img2);

async function carregarImagens() {
  try {
    const res = await fetch("/api/imagens");
    imagens = await res.json();

    if (imagens.length > 0) {
      img1.src = imagens[0].caminho;
      img1.style.opacity = 1;
      indexAtual = 1;
      setInterval(mostrarProximaImagem, 6000);
    }
  } catch (error) {
    console.error("Erro ao carregar imagens:", error);
  }
}

function mostrarProximaImagem() {
  if (imagens.length === 0) return;

  const proximaImg = imagens[indexAtual];
  const ativa = painel.querySelector(".imagem-tv.ativa");
  const proxima = painel.querySelector(".imagem-tv:not(.ativa)");

  proxima.src = proximaImg.caminho;
  proxima.style.opacity = 0;
  proxima.classList.add("fade-in");

  setTimeout(() => {
    ativa.style.opacity = 0;
    proxima.style.opacity = 1;

    ativa.classList.remove("ativa");
    proxima.classList.add("ativa");
  }, 100);

  indexAtual = (indexAtual + 1) % imagens.length;
}

carregarImagens();


// ========================
// CLIMA (Vitória - ES)
// ========================
async function atualizarClima() {
  try {
    const resposta = await fetch("/api/clima");
    const dados = await resposta.json();

    document.getElementById("clima").textContent = dados.temperatura + "°C";
  } catch (e) {
    document.getElementById("clima").textContent = "--°C";
  }
}

setInterval(atualizarClima, 60000); // Atualiza a cada 1 min
atualizarClima();
// ========================
// Reload automático do painel TV
// ========================
setInterval(() => {
  location.reload();
}, 10 * 60 * 1000); // 10 minutos


// ========================
// Secretaria e Chamada (Novo)
// ========================
let ultimaSenhaConhecida = "";

async function verificarSecretaria() {
  try {
    const resposta = await fetch("/api/secretaria");
    const dados = await resposta.json();

    const statusBox = document.getElementById("statusBox");
    const statusTexto = document.getElementById("statusTexto");
    const numeroSenha = document.getElementById("numeroSenha");
    const audio = document.getElementById("audioChamada");

    if (!statusBox || !statusTexto || !numeroSenha) return;

    // Atualiza o texto do status e a senha na tela
    statusTexto.textContent = dados.status.toUpperCase();
    numeroSenha.textContent = dados.ultima_senha;

    // Atualiza a cor do card (livre, ocupado, fechado)
    statusBox.className = `status-card ${dados.status}`;

    // LÓGICA DO SOM E ALERTA: 
    // Se a senha no banco for diferente da que temos na memória...
    if (dados.ultima_senha !== ultimaSenhaConhecida && ultimaSenhaConhecida !== "") {
      
      // 1. Toca o barulho (som-alerta.mp3)
      if (audio) {
        audio.play().catch(e => console.log("Clique na tela para liberar o áudio."));
      }

      // 2. Faz o card piscar para chamar atenção
      statusBox.classList.add("piscar");
      
      // Para de piscar depois de 6 segundos
      setTimeout(() => {
        statusBox.classList.remove("piscar");
      }, 6000);
    }

    // Guarda a senha atual para comparar na próxima volta
    ultimaSenhaConhecida = dados.ultima_senha;

  } catch (error) {
    console.error("Erro ao buscar dados da secretaria:", error);
  }
}

// Verifica se houve atualização na secretaria a cada 2 segundos
setInterval(verificarSecretaria, 2000);
verificarSecretaria();
// ========================
// Lógica do Pachequinho
// ========================
// ========================
// Inteligência Unificada do Pachequinho
// ========================
const falasDoPachequinho = [
    "Oláaa! Sou o Pachequinho, o mascote da Renato Pacheco!",
    "Já deu uma olhada no cardápio de hoje? 🍽️",
    "Não esqueça: foco nos estudos para o ENEM! 📚",
    "A secretaria está disponível para tirar suas dúvidas.",
    "Respeite os professores e mantenha a escola limpa! ✨",
    "Beba água e tenha um excelente dia de aprendizado!",
    "O futuro pertence àqueles que acreditam nos seus sonhos. 🚀",
    "Lave as mãos antes de comer! 🧼",
    "O Renato Pacheco é a melhor escola! 🏫"
];

function atualizarFalaMascote() {
    const balao = document.getElementById("fala-pachequinho");
    if (!balao) return;

    const temperaturaTexto = document.getElementById("clima").textContent;
    const temp = parseInt(temperaturaTexto);

    let listaFalas = [...falasDoPachequinho];

    // Reação dinâmica ao Clima (Vitória - ES)
    if (!isNaN(temp)) {
        if (temp > 30) {
            listaFalas.push("Nossa, que calor em Vitória! Hidrate-se bem! 💧");
        } else if (temp < 20) {
            listaFalas.push("Está um friozinho hoje, né? Não esqueça o casaco! 🧥");
        }
    }

    // Sorteia uma frase aleatória
    const fraseSorteada = listaFalas[Math.floor(Math.random() * listaFalas.length)];

    // Efeito de transição suave (Fade Out -> Troca -> Fade In)
    balao.style.opacity = 0;
    
    setTimeout(() => {
        balao.textContent = fraseSorteada;
        balao.style.opacity = 1;
    }, 500);
}

// Troca a fala a cada 25 segundos (tempo equilibrado para leitura)
setInterval(atualizarFalaMascote, 25000);

// Inicia a primeira fala logo após o carregamento
setTimeout(atualizarFalaMascote, 2000);