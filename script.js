// Aguarda o carregamento completo do HTML antes de executar qualquer código
document.addEventListener("DOMContentLoaded", () => {

    // 1. SELEÇÃO DE ELEMENTOS DO DOM
    const loginScreen = document.getElementById("login-screen");
    const workoutScreen = document.getElementById("workout-screen");
    const credencialInput = document.getElementById("credencial-input");
    const btnEntrar = document.getElementById("btn-entrar");
    const loginError = document.getElementById("login-error");
    const alunoNomeSpan = document.getElementById("aluno-nome");
    const fichaInfoDiv = document.getElementById("ficha-info");
    const fichaContentDiv = document.getElementById("ficha-content");
    const btnSair = document.getElementById("btn-sair");
    const btnSalvarCargas = document.getElementById("btn-salvar-cargas");

    let alunoAtual = null;

    // Dicionário de técnicas avançadas
    const tecnicasDescricoes = {
        "Drop set": "Realizar o exercício até a falha e reduzir o peso para continuar até a falha novamente.",
        "Rest-pause": "Ir até a falha, descansar 10–20s e continuar com o mesmo peso.",
        "Bi-set": "Dois exercícios em sequência sem descanso.",
        "Tri-set": "Três exercícios em sequência sem descanso.",
        "Giant set": "Quatro ou mais exercícios em sequência sem descanso.",
        "Super-set": "Dois exercícios de grupos opostos sem descanso.",
        "Pré-exaustão": "Exercício isolado antes do composto para o mesmo músculo.",
        "Pós-exaustão": "Exercício isolado após o composto para o mesmo músculo.",
        "Isometria": "Manter a contração por tempo definido.",
        "Parciais": "Repetições com amplitude reduzida na parte mais difícil.",
        "Forçada": "Ajuda do parceiro nas últimas repetições.",
        "Negativa": "Ênfase na fase excêntrica, descendo de forma lenta.",
        "Cluster set": "Dividir a série em mini-blocos com pequenos descansos.",
        "Piramidal crescente": "Aumenta peso e reduz repetições a cada série.",
        "Piramidal decrescente": "Reduz peso e aumenta repetições a cada série.",
        "FST-7": "7 séries de 10–15 repetições com 30–45s de descanso, geralmente no final."
    };

    // 2. DECLARAÇÃO DAS FUNÇÕES
    async function mostrarFicha(aluno) {
        alunoAtual = aluno;
        alunoNomeSpan.textContent = `Olá, ${aluno.nome.split(" ")[0]}!`;
        fichaInfoDiv.innerHTML = "";
        fichaContentDiv.innerHTML = "";

        const ficha = aluno.ficha_treino;

        if (ficha && ficha.exercicios && ficha.exercicios.length > 0) {
            const dataFormatada = new Date(ficha.data_troca).toLocaleDateString("pt-BR", { timeZone: "UTC" });
            fichaInfoDiv.innerHTML = `<p><strong>Data da Ficha:</strong> ${dataFormatada}</p>${ficha.observacoes ? `<p><strong>Observações:</strong> ${ficha.observacoes}</p>` : ""}`;

            const nomesExercicios = ficha.exercicios.map(ex => ex.exercicio);
            const { data: ultimasCargas } = await _supabase.from("treinos_realizados").select("exercicio_nome, carga_kg").eq("aluno_id", aluno.id).in("exercicio_nome", nomesExercicios).order("data_treino", { ascending: false });
            
            const mapaCargas = {};
            if (ultimasCargas) {
                ultimasCargas.forEach(carga => {
                    if (!mapaCargas[carga.exercicio_nome]) {
                        mapaCargas[carga.exercicio_nome] = carga.carga_kg;
                    }
                });
            }

            ficha.exercicios.forEach(ex => {
                const exercicioDiv = document.createElement("div");
                exercicioDiv.className = "exercicio";
                const ultimaCarga = mapaCargas[ex.exercicio] || "";
                const descricaoTecnica = ex.tecnica ? tecnicasDescricoes[ex.tecnica] || "" : "";
                const htmlTecnica = ex.tecnica ? `<div class="exercicio-tecnica">Técnica: <strong>${ex.tecnica}</strong>${descricaoTecnica ? `<span> — ${descricaoTecnica}</span>` : ""}</div>` : "";

                exercicioDiv.innerHTML = `
                    <div class="exercicio-nome">${ex.exercicio}</div>
                    <div class="exercicio-detalhes"><span>Séries: <strong>${ex.series}</strong></span> <span>Repetições: <strong>${ex.repeticoes}</strong></span></div>
                    ${htmlTecnica}
                    <div class="carga-input"><label>Carga (kg):</label><input type="number" class="carga-valor" data-exercicio-nome="${ex.exercicio}" value="${ultimaCarga}" placeholder="0"></div>
                `;
                fichaContentDiv.appendChild(exercicioDiv);
            });

            btnSalvarCargas.style.display = "block";
        } else {
            fichaContentDiv.innerHTML = '<div class="empty-state">Sua ficha de treino ainda não foi criada.</div>';
            btnSalvarCargas.style.display = "none";
        }

        loginScreen.classList.remove("active");
        workoutScreen.classList.add("active");
    }

    async function login() {
        const credencial = credencialInput.value.trim().toUpperCase();
        if (!credencial) {
            loginError.textContent = "Por favor, insira sua credencial.";
            return;
        }
        loginError.textContent = "";
        btnEntrar.disabled = true;
        btnEntrar.textContent = "Verificando...";
        const { data, error } = await _supabase.from("clients").select("id, nome, ficha_treino").eq("credencial", credencial).single();
        btnEntrar.disabled = false;
        btnEntrar.textContent = "Entrar";
        if (error || !data) {
            console.error("Erro de login ou credencial não encontrada:", error);
            loginError.textContent = "Credencial inválida. Verifique e tente novamente.";
        } else {
            sessionStorage.setItem("alunoLogadoId", data.id);
            mostrarFicha(data);
        }
    }

    function logout() {
        alunoAtual = null;
        sessionStorage.removeItem("alunoLogadoId");
        loginScreen.classList.add("active");
        workoutScreen.classList.remove("active");
        credencialInput.value = "";
    }

    async function salvarCargas() {
        if (!alunoAtual) return;
        const inputsDeCarga = document.querySelectorAll(".carga-valor");
        const registrosDeTreino = [];
        const hoje = new Date().toISOString().split("T")[0];
        inputsDeCarga.forEach(input => {
            const carga = parseFloat(input.value);
            if (carga > 0) {
                registrosDeTreino.push({
                    aluno_id: alunoAtual.id,
                    exercicio_nome: input.dataset.exercicioNome,
                    carga_kg: carga,
                    data_treino: hoje
                });
            }
        });
        if (registrosDeTreino.length === 0) {
            alert("Nenhuma carga preenchida para salvar.");
            return;
        }
        btnSalvarCargas.disabled = true;
        btnSalvarCargas.textContent = "Salvando...";
        
        // MODIFICADO: Usando upsert para atualizar ou inserir
        const { error } = await _supabase.from("treinos_realizados").upsert(registrosDeTreino, {
            onConflict: "aluno_id, exercicio_nome, data_treino" // Colunas que formam a chave única
        });

        btnSalvarCargas.disabled = false;
        btnSalvarCargas.textContent = "Salvar Cargas do Treino";
        if (error) {
            console.error("Erro ao salvar cargas:", error);
            alert(`Ocorreu um erro ao salvar as cargas. Detalhes: ${error.message}`);
        } else {
            alert("Cargas do treino salvas com sucesso!");
        }
    }

    async function verificarSessao() {
        const alunoId = sessionStorage.getItem("alunoLogadoId");
        if (alunoId) {
            const { data, error } = await _supabase.from("clients").select("id, nome, ficha_treino").eq("id", alunoId).single();
            if (data && !error) {
                mostrarFicha(data);
            } else {
                logout();
            }
        }
    }

    // 3. ADIÇÃO DOS EVENT LISTENERS
    btnEntrar.addEventListener("click", login);
    btnSair.addEventListener("click", logout);
    btnSalvarCargas.addEventListener("click", salvarCargas);

    // 4. INICIALIZAÇÃO
    verificarSessao();
    console.log("App do Aluno pronto e ouvintes de eventos adicionados.");
});

