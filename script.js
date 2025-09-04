// script.js (VERSÃO FINAL, COMPLETA E MELHORADA)

document.addEventListener("DOMContentLoaded", () => {
    // --- 1. SELEÇÃO DE ELEMENTOS DO DOM ---
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

    // Dicionário de descrições para as técnicas avançadas
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

    // --- 2. FUNÇÕES PRINCIPAIS ---

    /**
     * Exibe a ficha de treino do aluno na tela.
     * @param {object} aluno - O objeto do aluno contendo id e nome.
     * @param {object|null} ficha - O objeto da ficha de treino ou null se não houver.
     */
    async function mostrarFicha(aluno, ficha) {
        alunoAtual = aluno;
        alunoNomeSpan.textContent = `Olá, ${aluno.nome.split(" ")[0]}!`;
        fichaInfoDiv.innerHTML = "";
        fichaContentDiv.innerHTML = '<div class="empty-state">Carregando dados...</div>'; // Estado inicial de carregamento

        if (ficha && ficha.exercicios && ficha.exercicios.length > 0) {
            const dataFormatada = new Date(ficha.data_troca).toLocaleDateString("pt-BR", { timeZone: "UTC" });
            fichaInfoDiv.innerHTML = `
                <p><strong>Ficha:</strong> ${ficha.name}</p>
                <p><strong>Data da Troca:</strong> ${dataFormatada}</p>
                ${ficha.observacoes ? `<p><strong>Observações:</strong> ${ficha.observacoes}</p>` : ""}
            `;

            // Busca as últimas cargas registradas para os exercícios da ficha
            const nomesExercicios = ficha.exercicios.map(ex => ex.exercicio);
            const { data: ultimasCargas, error: cargasError } = await _supabase
                .from("treinos_realizados")
                .select("exercicio_nome, carga_kg")
                .eq("aluno_id", aluno.id)
                .in("exercicio_nome", nomesExercicios)
                .order("data_treino", { ascending: false });
            
            if (cargasError) {
                console.error("Erro ao buscar últimas cargas:", cargasError);
            }

            const mapaCargas = {};
            if (ultimasCargas) {
                ultimasCargas.forEach(carga => {
                    if (!mapaCargas[carga.exercicio_nome]) {
                        mapaCargas[carga.exercicio_nome] = carga.carga_kg;
                    }
                });
            }

            fichaContentDiv.innerHTML = ""; // Limpa o "Carregando..."
            ficha.exercicios.forEach(ex => {
                const exercicioDiv = document.createElement("div");
                exercicioDiv.className = "exercicio";
                const ultimaCarga = mapaCargas[ex.exercicio] || "";
                const descricaoTecnica = ex.tecnica ? (tecnicasDescricoes[ex.tecnica] || "") : "";
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
            // Caso não haja ficha ou a ficha esteja vazia
            fichaContentDiv.innerHTML = '<div class="empty-state">Sua ficha de treino ainda não foi criada.</div>';
            btnSalvarCargas.style.display = "none";
        }

        // Transição suave entre as telas
        loginScreen.classList.remove("active");
        workoutScreen.classList.add("active");
    }

    /**
     * ✅ FUNÇÃO CORRIGIDA E MELHORADA
     * Realiza o login do usuário, buscando o aluno e sua ficha mais recente.
     */
    async function login() {
        const credencial = credencialInput.value.trim().toUpperCase();
        if (!credencial) {
            loginError.textContent = "Por favor, insira sua credencial.";
            return;
        }
        loginError.textContent = "";
        btnEntrar.disabled = true;
        btnEntrar.textContent = "Verificando...";

        // 1. Encontrar o aluno pela credencial
        const { data: aluno, error: alunoError } = await _supabase
            .from("clients")
            .select("id, nome")
            .eq("credencial", credencial)
            .single();

        if (alunoError || !aluno) {
            btnEntrar.disabled = false;
            btnEntrar.textContent = "Entrar";
            console.error("Erro de login ou credencial não encontrada:", alunoError);
            loginError.textContent = "Credencial inválida. Verifique e tente novamente.";
            return;
        }

        // 2. Se o aluno foi encontrado, buscar a ficha mais recente (SEM .single())
        const { data: fichas, error: fichaError } = await _supabase
            .from("planos_de_treino")
            .select("*")
            .eq("user_id", aluno.id)
            .order("data_troca", { ascending: false })
            .limit(1);

        if (fichaError) {
            console.error("Erro ao buscar a ficha de treino:", fichaError);
            // O login continua mesmo com erro na ficha, a tela mostrará o estado vazio.
        }

        btnEntrar.disabled = false;
        btnEntrar.textContent = "Entrar";

        // Pega a primeira ficha do array (pode ser null se não houver)
        const fichaMaisRecente = fichas ? fichas[0] : null;

        sessionStorage.setItem("alunoLogadoId", aluno.id);
        mostrarFicha(aluno, fichaMaisRecente);
    }

    /**
     * Realiza o logout do usuário, limpando a sessão.
     */
    function logout() {
        alunoAtual = null;
        sessionStorage.removeItem("alunoLogadoId");
        loginScreen.classList.add("active");
        workoutScreen.classList.remove("active");
        credencialInput.value = "";
    }

    /**
     * Salva as cargas preenchidas pelo aluno no banco de dados.
     */
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
        
        // Upsert para inserir ou atualizar o registro do dia
        const { error } = await _supabase.from("treinos_realizados").upsert(registrosDeTreino, {
            onConflict: "aluno_id, exercicio_nome, data_treino"
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

    /**
     * ✅ FUNÇÃO CORRIGIDA E MELHORADA
     * Verifica se há uma sessão ativa e carrega os dados do aluno.
     */
    async function verificarSessao() {
        const alunoId = sessionStorage.getItem("alunoLogadoId");
        if (alunoId) {
            // Mostra um estado de carregamento inicial
            loginScreen.classList.remove("active");
            workoutScreen.classList.add("active");
            alunoNomeSpan.textContent = "Carregando...";
            fichaContentDiv.innerHTML = '<div class="empty-state">Verificando sessão...</div>';

            // 1. Busca os dados do aluno
            const { data: aluno, error: alunoError } = await _supabase
                .from("clients")
                .select("id, nome")
                .eq("id", alunoId)
                .single();

            if (aluno && !alunoError) {
                // 2. Busca a ficha mais recente (SEM .single())
                const { data: fichas, error: fichaError } = await _supabase
                    .from("planos_de_treino")
                    .select("*")
                    .eq("user_id", aluno.id)
                    .order("data_troca", { ascending: false })
                    .limit(1);
                
                if (fichaError) {
                    console.error("Erro ao buscar ficha na verificação de sessão:", fichaError);
                }

                const fichaMaisRecente = fichas ? fichas[0] : null;
                mostrarFicha(aluno, fichaMaisRecente);
            } else {
                // Se não encontrar o aluno pelo ID (ex: foi deletado), faz logout
                console.error("Erro ao verificar sessão, aluno não encontrado:", alunoError);
                logout();
            }
        }
    }

    // --- 3. ADIÇÃO DOS EVENT LISTENERS ---
    btnEntrar.addEventListener("click", login);
    btnSair.addEventListener("click", logout);
    btnSalvarCargas.addEventListener("click", salvarCargas);
    // Permite login com a tecla Enter
    credencialInput.addEventListener("keyup", (event) => {
        if (event.key === "Enter") {
            login();
        }
    });

    // --- 4. INICIALIZAÇÃO ---
    verificarSessao();
    console.log("App do Aluno pronto e ouvintes de eventos adicionados.");
});
