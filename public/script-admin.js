// ====================
// Gerenciamento de Imagens
// ====================
const uploadForm = document.getElementById("uploadForm");
const imagemInput = document.getElementById("imagemInput");
const listaImagens = document.getElementById("listaImagens");

uploadForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!imagemInput.files[0]) return alert("Selecione uma imagem.");
  const formData = new FormData();
  formData.append("imagem", imagemInput.files[0]);

  const res = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  if (res.ok) {
    alert("Imagem enviada com sucesso!");
    imagemInput.value = "";
    carregarImagens();
  } else {
    alert("Erro ao enviar imagem.");
  }
});

async function carregarImagens() {
  try {
    const res = await fetch("/api/imagens");
    const imagens = await res.json();
    listaImagens.innerHTML = "";

    if (!imagens.length) {
      listaImagens.innerHTML = "<p>Nenhuma imagem enviada.</p>";
      return;
    }

    imagens.forEach((img) => {
      const div = document.createElement("div");
      div.style.textAlign = "center";
      div.innerHTML = `
        <img src="${img.caminho}" alt="" style="max-width: 200px; border-radius: 8px; margin: 10px 0;">
        <br>
        <button onclick="removerImagem(${img.id})">Remover</button>
      `;
      listaImagens.appendChild(div);
    });
  } catch (err) {
    console.error("Erro ao carregar imagens:", err);
    listaImagens.innerHTML = "<p>Erro ao carregar imagens.</p>";
  }
}

async function removerImagem(id) {
  if (!confirm("Tem certeza que deseja excluir esta imagem?")) return;
  try {
    const res = await fetch(`/api/imagens/${id}`, { method: "DELETE" });
    if (res.ok) {
      carregarImagens();
    } else {
      alert("Erro ao remover imagem.");
    }
  } catch (err) {
    console.error(err);
    alert("Erro ao remover imagem.");
  }
}

carregarImagens();


// ====================
// Cardápio (carregar + salvar)
// ====================
const cardapioForm = document.getElementById("cardapioForm");
const dias = ["segunda", "terca", "quarta", "quinta", "sexta"];

async function carregarCardapio() {
  try {
    for (const dia of dias) {
      const res = await fetch(`/api/cardapio/${dia}`);
      if (!res.ok) {
        console.warn(`Falha ao buscar cardápio de ${dia}`);
        continue;
      }
      const data = await res.json();

      // Preenche os dois campos (matutino e vespertino)
      const campoMat = cardapioForm.querySelector(`[name="${dia}_matutino"]`);
      const campoVesp = cardapioForm.querySelector(`[name="${dia}_vespertino"]`);

      if (campoMat) campoMat.value = data.matutino || "";
      if (campoVesp) campoVesp.value = data.vespertino || "";
    }
  } catch (err) {
    console.error("Erro ao carregar cardápio:", err);
  }
}

cardapioForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    const formDataObj = {};
    for (const dia of dias) {
      const matutino = cardapioForm.querySelector(`[name="${dia}_matutino"]`)?.value.trim() || "";
      const vespertino = cardapioForm.querySelector(`[name="${dia}_vespertino"]`)?.value.trim() || "";
      formDataObj[`${dia}_matutino`] = matutino;
      formDataObj[`${dia}_vespertino`] = vespertino;
    }

    const res = await fetch("/api/cardapio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formDataObj),
    });

    if (res.ok) {
      alert("Cardápio atualizado com sucesso!");
    } else {
      const err = await res.json().catch(() => null);
      console.error("Erro ao salvar cardápio:", err);
      alert("Erro ao salvar cardápio.");
    }
  } catch (err) {
    console.error("Erro ao salvar cardápio:", err);
    alert("Erro ao salvar cardápio.");
  }
});

carregarCardapio();
// ====================
// Controle da Secretaria (Novo)
// ====================

// Função para mudar apenas o status (Livre, Ocupado, Fechado)
async function atualizarStatus(novoStatus) {
    // Pega o que estiver escrito no input no momento
    const inputSenha = document.getElementById('inputSenha');
    const senhaAtual = inputSenha ? inputSenha.value : "--";
    
    await enviarDadosSecretaria(novoStatus, senhaAtual);
}

// Função para o botão "CHAMAR AGORA"
async function chamarProximo() {
    const inputSenha = document.getElementById('inputSenha');
    const senhaNome = inputSenha.value.trim();

    if (!senhaNome) {
        alert("⚠️ Por favor, digite o nome ou o número antes de chamar!");
        return;
    }

    // Ao chamar alguém, o status muda automaticamente para 'ocupado'
    await enviarDadosSecretaria('ocupado', senhaNome);
    console.log("Chamada enviada para a TV!");
}

// Função que faz o fetch para a API do seu server.js
async function enviarDadosSecretaria(status, senha) {
    try {
        const response = await fetch('/api/secretaria', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                status: status, 
                senha: senha 
            })
        });

        const resultado = await response.json();

        if (resultado.success) {
            console.log(`Sucesso: Secretaria agora está ${status}`);
            // Feedback visual simples:
            const btnChamar = document.querySelector('.btn-chamar');
            if(btnChamar) {
                btnChamar.innerText = "CHAMADO! ✅";
                setTimeout(() => btnChamar.innerText = "CHAMAR AGORA 🔊", 2000);
            }
        } else {
            alert("Erro ao atualizar a secretaria no banco de dados.");
        }
    } catch (erro) {
        console.error("Erro na requisição da secretaria:", erro);
        alert("Não foi possível conectar ao servidor.");
    }
}

// Torna as funções globais para que o "onclick" do HTML as encontre
window.atualizarStatus = atualizarStatus;
window.chamarProximo = chamarProximo;