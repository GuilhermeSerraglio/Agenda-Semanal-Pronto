import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  doc,
  query,
  where
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

let tarefas = [];
let dataAtual = new Date();

function formatarData(data) {
  return data.toISOString().split('T')[0];
}

function atualizarSemana() {
  const inicio = new Date(dataAtual);
  inicio.setDate(inicio.getDate() - inicio.getDay());

  const fim = new Date(inicio);
  fim.setDate(inicio.getDate() + 6);

  document.getElementById("semana-atual").textContent = `${formatarData(inicio)} até ${formatarData(fim)}`;
  exibirTarefas();
}

window.alterarSemana = function (direcao) {
  dataAtual.setDate(dataAtual.getDate() + (7 * direcao));
  atualizarSemana();
};

function getDataPorDiaSemana(nomeDia) {
  const dias = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"];
  const index = dias.indexOf(nomeDia);
  const inicio = new Date(dataAtual);
  inicio.setDate(inicio.getDate() - inicio.getDay());
  inicio.setDate(inicio.getDate() + index);
  return formatarData(inicio);
}

window.abrirModal = function (dia) {
  document.getElementById("modalTarefa").style.display = "flex";
  document.getElementById("dia").value = dia;
  document.getElementById("data").value = getDataPorDiaSemana(dia);
};

window.fecharModal = function () {
  document.getElementById("modalTarefa").style.display = "none";
  document.getElementById("formTarefa").reset();
};

function limparAgenda() {
  const dias = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"];
  dias.forEach(dia => {
    const coluna = document.getElementById(dia);
    coluna.querySelectorAll(".tarefa").forEach(el => el.remove());
  });
}

function getInicioFimSemana() {
  const inicio = new Date(dataAtual);
  inicio.setDate(inicio.getDate() - inicio.getDay());

  const fim = new Date(inicio);
  fim.setDate(inicio.getDate() + 6);

  return [formatarData(inicio), formatarData(fim)];
}

async function exibirTarefas() {
  if (!window.db || !window.auth) return;

  limparAgenda();
  const user = window.auth.currentUser;
  if (!user) return;

  const [inicio, fim] = getInicioFimSemana();
  const ref = collection(window.db, "tarefas");
  const q = query(ref, where("uid", "==", user.uid));
  const snapshot = await getDocs(q);

  tarefas = [];
  snapshot.forEach(docSnap => {
    const tarefa = docSnap.data();
    tarefa.id = docSnap.id;
    tarefas.push(tarefa);
  });

  tarefas.filter(t => t.data >= inicio && t.data <= fim).forEach(t => adicionarNaTela(t));
}

function adicionarNaTela(tarefa) {
  const container = document.getElementById(tarefa.dia);
  const div = document.createElement("div");
  div.className = "tarefa";
  div.innerHTML = `
    <strong>${tarefa.hora} - ${tarefa.titulo}</strong><br>
    ${tarefa.descricao}<br>
    ${tarefa.data}<br>
    <div class="acoes">
      <button onclick="editarTarefa('${tarefa.id}')">✎</button>
      <button onclick="removerTarefa('${tarefa.id}')">🗑️</button>
    </div>
  `;
  container.appendChild(div);
}

window.removerTarefa = async function (id) {
  await deleteDoc(doc(window.db, "tarefas", id));
  exibirTarefas();
};

window.editarTarefa = function (id) {
  const tarefa = tarefas.find(t => t.id === id);
  if (!tarefa) return;
  abrirModal(tarefa.dia);
  document.getElementById("titulo").value = tarefa.titulo;
  document.getElementById("descricao").value = tarefa.descricao;
  document.getElementById("hora").value = tarefa.hora;
  document.getElementById("dia").value = tarefa.dia;
  document.getElementById("data").value = tarefa.data;
  document.getElementById("formTarefa").onsubmit = async (e) => {
    e.preventDefault();
    const atualizada = obterDadosFormulario();
    await updateDoc(doc(window.db, "tarefas", id), atualizada);
    fecharModal();
    exibirTarefas();
  };
};

function obterDadosFormulario() {
  return {
    titulo: document.getElementById("titulo").value,
    descricao: document.getElementById("descricao").value,
    hora: document.getElementById("hora").value,
    dia: document.getElementById("dia").value,
    data: document.getElementById("data").value,
    uid: window.auth.currentUser.uid
  };
}

document.getElementById("formTarefa").addEventListener("submit", async (e) => {
  e.preventDefault();
  const nova = obterDadosFormulario();
  await addDoc(collection(window.db, "tarefas"), nova);
  fecharModal();
  exibirTarefas();
});

window.imprimirAgenda = function () {
  window.print();
};


import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";

const auth = getAuth();
window.auth = auth;

onAuthStateChanged(auth, (user) => {
  if (user) {
    window.db = window.db || window.firebaseDb;
    atualizarSemana();
  } else {
    window.location.href = "login.html";
  }
});
