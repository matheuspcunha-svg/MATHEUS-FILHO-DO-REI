/* O navegador conversa com Flask. Somente Python conhece a chave do Supabase. */
const formularioProduto = document.getElementById("formulario-produto");
const mensagemProduto = document.getElementById("mensagem-produto");
const mensagemLista = document.getElementById("mensagem-lista");
const listaProdutos = document.getElementById("lista-produtos");
const campoCategoria = document.getElementById("categoria");
const produtoCarrinho = document.getElementById("produto-carrinho");
const botaoCadastrarProduto = document.getElementById("botao-cadastrar-produto");

const formularioCliente = document.getElementById("formulario-cliente");
const mensagemCliente = document.getElementById("mensagem-cliente");
const campoCliente = document.getElementById("cliente-selecionado");
const mensagemSelecao = document.getElementById("mensagem-selecao");

const formularioCarrinho = document.getElementById("formulario-carrinho");
const campoQuantidadeCarrinho = document.getElementById("quantidade-carrinho");
const mensagemCarrinho = document.getElementById("mensagem-carrinho");
const listaCarrinho = document.getElementById("lista-carrinho");
const totalCarrinho = document.getElementById("total-carrinho");

function mostrarMensagem(elemento, texto, sucesso) {
  elemento.textContent = texto;
  elemento.className = `mensagem ${sucesso ? "sucesso" : "erro"}`;
}

function formatarMoeda(valor) {
  return Number(valor).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

async function carregarCategorias() {
  try {
    const resposta = await fetch("/api/categorias");
    const dados = await resposta.json();

    if (!resposta.ok) {
      mostrarMensagem(mensagemProduto, dados.mensagem, false);
      return;
    }

    campoCategoria.replaceChildren(new Option("Selecione uma categoria", ""));
    for (const categoria of dados) {
      const opcao = document.createElement("option");
      opcao.value = categoria.categoria_id;
      opcao.textContent = categoria.nome;
      campoCategoria.appendChild(opcao);
    }

    if (dados.length === 0) {
      mostrarMensagem(mensagemProduto, "Cadastre as categorias executando o SQL da aula.", false);
    }
  } catch (erro) {
    mostrarMensagem(mensagemProduto, "Não foi possível carregar as categorias. Confira o servidor.", false);
  }
}

async function carregarProdutos() {
  mensagemLista.textContent = "Consultando produtos...";
  try {
    const resposta = await fetch("/api/produtos");
    const produtos = await resposta.json();
    if (!resposta.ok) {
      mensagemLista.textContent = produtos.mensagem;
      return;
    }

    listaProdutos.replaceChildren();
    produtoCarrinho.replaceChildren(new Option("Selecione um produto", ""));

    for (const produto of produtos) {
      const linha = document.createElement("tr");
      const valores = [
        produto.nome,
        produto.categorias ? produto.categorias.nome : "Sem categoria",
        formatarMoeda(produto.preco),
        produto.estoque,
      ];

      for (const valor of valores) {
        const celula = document.createElement("td");
        celula.textContent = valor;
        linha.appendChild(celula);
      }

      listaProdutos.appendChild(linha);

      const opcaoProduto = document.createElement("option");
      opcaoProduto.value = produto.produto_id;
      opcaoProduto.textContent = `${produto.nome} (${formatarMoeda(produto.preco)})`;
      produtoCarrinho.appendChild(opcaoProduto);
    }

    mensagemLista.textContent = produtos.length === 0 ? "Nenhum produto cadastrado." : "Lista atualizada.";
  } catch (erro) {
    mensagemLista.textContent = "Não foi possível atualizar a lista. Confira o servidor.";
  }
}

async function carregarClientes() {
  try {
    const resposta = await fetch("/api/clientes");
    const clientes = await resposta.json();

    if (!resposta.ok) {
      mostrarMensagem(mensagemCliente, clientes.mensagem, false);
      return;
    }

    const clienteSelecionado = campoCliente.value;
    campoCliente.replaceChildren(new Option("Selecione um cliente", ""));

    for (const cliente of clientes) {
      const opcao = document.createElement("option");
      opcao.value = cliente.cliente_id;
      opcao.textContent = `${cliente.nome} (${cliente.email})`;
      campoCliente.appendChild(opcao);
    }

    if (clienteSelecionado) {
      campoCliente.value = clienteSelecionado;
    }

    if (clientes.length === 0) {
      mostrarMensagem(mensagemSelecao, "Cadastre um cliente antes de criar o carrinho.", false);
    }
  } catch (erro) {
    mostrarMensagem(mensagemCliente, "Não foi possível carregar os clientes.", false);
  }
}

async function carregarCarrinho() {
  const clienteId = campoCliente.value;

  if (!clienteId) {
    listaCarrinho.replaceChildren();
    totalCarrinho.textContent = "R$ 0,00";
    mensagemCarrinho.textContent = "Selecione um cliente para consultar o carrinho.";
    mensagemCarrinho.className = "mensagem erro";
    return;
  }

  try {
    const resposta = await fetch(`/api/carrinho?cliente_id=${clienteId}`);
    const dados = await resposta.json();

    if (!resposta.ok) {
      mostrarMensagem(mensagemCarrinho, dados.mensagem, false);
      listaCarrinho.replaceChildren();
      totalCarrinho.textContent = "R$ 0,00";
      return;
    }

    listaCarrinho.replaceChildren();

    if (!dados.itens || dados.itens.length === 0) {
      const linha = document.createElement("tr");
      const celula = document.createElement("td");
      celula.colSpan = 5;
      celula.textContent = "Nenhum item no carrinho para este cliente.";
      linha.appendChild(celula);
      listaCarrinho.appendChild(linha);
      totalCarrinho.textContent = "R$ 0,00";
      mostrarMensagem(mensagemCarrinho, "Carrinho vazio.", true);
      return;
    }

    for (const item of dados.itens) {
      const linha = document.createElement("tr");
      linha.innerHTML = `
        <td>${item.nome}</td>
        <td>${item.quantidade}</td>
        <td>${formatarMoeda(item.preco_unitario)}</td>
        <td>${formatarMoeda(item.subtotal)}</td>
        <td><button type="button" class="botao-remover" data-id="${item.carrinho_id}">Remover</button></td>
      `;
      listaCarrinho.appendChild(linha);
    }

    totalCarrinho.textContent = formatarMoeda(dados.total);
    mensagemCarrinho.textContent = "Carrinho atualizado.";
    mensagemCarrinho.className = "mensagem sucesso";
  } catch (erro) {
    mostrarMensagem(mensagemCarrinho, "Não foi possível carregar o carrinho.", false);
  }
}

async function cadastrarCliente(evento) {
  evento.preventDefault();

  const cliente = {
    nome: document.getElementById("nome-cliente").value,
    email: document.getElementById("email-cliente").value,
    telefone: document.getElementById("telefone-cliente").value,
  };

  try {
    const resposta = await fetch("/api/clientes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cliente),
    });

    const dados = await resposta.json();
    mostrarMensagem(mensagemCliente, dados.mensagem, resposta.ok);

    if (resposta.ok) {
      formularioCliente.reset();
      await carregarClientes();
    }
  } catch (erro) {
    mostrarMensagem(mensagemCliente, "Não foi possível cadastrar o cliente. Tente novamente.", false);
  }
}

async function cadastrarProduto(evento) {
  evento.preventDefault();
  botaoCadastrarProduto.disabled = true;
  mostrarMensagem(mensagemProduto, "Enviando dados...", true);

  const produto = {
    nome: document.getElementById("nome").value,
    categoria_id: campoCategoria.value,
    preco: document.getElementById("preco").value,
    estoque: document.getElementById("estoque").value,
  };

  try {
    const resposta = await fetch("/api/produtos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(produto),
    });

    const dados = await resposta.json();
    mostrarMensagem(mensagemProduto, dados.mensagem, resposta.ok);

    if (resposta.ok) {
      formularioProduto.reset();
      await carregarProdutos();
    }
  } catch (erro) {
    mostrarMensagem(mensagemProduto, "Não foi possível confirmar o cadastro. Atualize a lista antes de reenviar.", false);
  } finally {
    botaoCadastrarProduto.disabled = false;
  }
}

async function adicionarItemCarrinho(evento) {
  evento.preventDefault();

  const clienteId = campoCliente.value;
  if (!clienteId) {
    mostrarMensagem(mensagemCarrinho, "Selecione um cliente antes de adicionar itens.", false);
    return;
  }

  const item = {
    cliente_id: Number(clienteId),
    produto_id: Number(produtoCarrinho.value),
    quantidade: Number(campoQuantidadeCarrinho.value),
  };

  if (!item.produto_id) {
    mostrarMensagem(mensagemCarrinho, "Selecione um produto válido.", false);
    return;
  }

  if (item.quantidade <= 0) {
    mostrarMensagem(mensagemCarrinho, "A quantidade deve ser maior que zero.", false);
    return;
  }

  try {
    const resposta = await fetch("/api/carrinho", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
    });

    const dados = await resposta.json();
    mostrarMensagem(mensagemCarrinho, dados.mensagem, resposta.ok);

    if (resposta.ok) {
      formularioCarrinho.reset();
      campoQuantidadeCarrinho.value = 1;
      await carregarCarrinho();
    }
  } catch (erro) {
    mostrarMensagem(mensagemCarrinho, "Não foi possível adicionar o item ao carrinho.", false);
  }
}

async function removerItemCarrinho(carrinhoId) {
  try {
    const resposta = await fetch(`/api/carrinho/${carrinhoId}`, {
      method: "DELETE",
    });

    const dados = await resposta.json();
    if (!resposta.ok) {
      mostrarMensagem(mensagemCarrinho, dados.mensagem, false);
      return;
    }

    mostrarMensagem(mensagemCarrinho, dados.mensagem, true);
    await carregarCarrinho();
  } catch (erro) {
    mostrarMensagem(mensagemCarrinho, "Não foi possível remover o item do carrinho.", false);
  }
}

formularioProduto.addEventListener("submit", cadastrarProduto);
formularioCliente.addEventListener("submit", cadastrarCliente);
formularioCarrinho.addEventListener("submit", adicionarItemCarrinho);
campoCliente.addEventListener("change", carregarCarrinho);
document.getElementById("botao-atualizar").addEventListener("click", carregarProdutos);
document.getElementById("botao-atualizar-carrinho").addEventListener("click", carregarCarrinho);

listaCarrinho.addEventListener("click", async (evento) => {
  const botao = evento.target.closest(".botao-remover");
  if (!botao) {
    return;
  }

  await removerItemCarrinho(botao.dataset.id);
});

carregarCategorias();
carregarProdutos();
carregarClientes();
carregarCarrinho();