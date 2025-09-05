// script.js (VERSÃO CORRIGIDA - MOSTRA TODAS AS FICHAS)

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
    let fichasDoAluno = [];
    let fichaAtualIndex = 0;

    // Dicionário de descrições para as técnicas avançadas
    const tecnicasDescricoes = {
        "Drop set": "Realizar o exercício até a falha e reduzir o peso para continuar até a falha novamente.",
        "Rest-pause": "Ir até a falha, descansar 10—20s e continuar com o mesmo peso.",
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
        "FST-7": "7 séries de 10—15 repetições com 30—45s de descanso, geralmente no final."
    };

    // --- 2. FUNÇÕES PRINCIPAIS ---

    /**
     * ✅ NOVA FUNÇÃO: Cria navegação entre fichas
     */
    function criarNavegacaoFichas() {
        if (fichasDoAluno.length <= 1) return '';
        
        return `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; background: #fff; padding: 10px; border-radius: 8px;">
                <button id="ficha-anterior" ${fichaAtualIndex === 0 ? 'disabled' : ''} 
                        style="background: #3498db; color: white; border: none; padding: 8px 12px; border-radius: 5px; cursor: pointer;">
                    ← Anterior
                </button>
                <span style="font-weight: 600;">
                    Ficha ${fichaAtualIndex + 1} de ${fichasDoAluno.length}
                </span>
                <button id="ficha-proximo" ${fichaAtualIndex === fichasDoAluno.length - 1 ? 'disabled' : ''} 
                        style="background: #3498db; color: white; border: none; padding: 8px 12px; border-radius: 5px; cursor: pointer;">
                    Próxima →
                </button>
            </div>
        `;
    }

    /**
     * ✅ FUNÇÃO CORRIGIDA: Exibe as fichas de treino do aluno na tela.
     */
    async function mostrarFichas(aluno, fichas) {
        alunoAtual = aluno;
        fichasDoAluno = fichas || [];
        fichaAtualIndex = 0;

        alunoNomeSpan.textContent = `Olá, ${aluno.nome.split(" ")[0]}!`;
        
        if (fichasDoAluno.length === 0) {
            fichaInfoDiv.innerHTML = "";
            fichaContentDiv.innerHTML = '<div class="empty-state">Suas fichas de treino ainda não foram criadas.</div>';
            btnSalvarCargas.style.display = "none";
            loginScreen.classList.remove("active");
            workoutScreen.classList.add("active");
            return;
        }

        await renderizarFichaAtual();
        
        // Transição suave entre as telas
        loginScreen.classList.remove("active");
        workoutScreen.classList.add("active");
    }

    /**
     * ✅ NOVA FUNÇÃO: Renderiza a ficha atual
     */
    async function renderizarFichaAtual() {
        const ficha = fichasDoAluno[fichaAtualIndex];
        
        if (!ficha) {
            fichaContentDiv.innerHTML = '<div class="empty-state">Erro ao carregar ficha.</div>';
            return;
        }

        // Criar navegação entre fichas
        const navegacao = criarNavegacaoFichas();
        
        // Info da ficha atual
        const dataFormatada = new Date(ficha.data_troca).toLocaleDateString("pt-BR", { timeZone: "UTC" });
        fichaInfoDiv.innerHTML = navegacao + `
            <div style="background: #e8f6ef; color: #229954; padding: 15px; border-radius: 8px; font-weight: 500;">
                <p style="margin: 5px 0;"><strong>Ficha:</strong> ${ficha.name}</p>
                <p style="margin: 5px 0;"><strong>Data da Troca:</strong> ${dataFormatada}</p>
                ${ficha.observacoes ? `<p style="margin: 5px 0;"><strong>Observações:</strong> ${ficha.observacoes}</p>` : ""}
            </div>
        `;

        // Adicionar event listeners para navegação (se existir)
        const btnAnterior = document.getElementById('ficha-anterior');
        const btnProximo = document.getElementById('ficha-proximo');
        
        if (btnAnterior) {
            btnAnterior.addEventListener('click', () => {
                if (fichaAtualIndex > 0) {
                    fichaAtualIndex--;
                    renderizarFichaAtual();
                }
            });
        }
        
        if (btnProximo) {
            btnProximo.addEventListener('click', () => {
                if (fichaAtualIndex < fichasDoAluno.length - 1) {
                    fichaAtualIndex++;
                    renderizarFichaAtual();
                }
            });
        }

        if (ficha.exercicios && ficha.exercicios.length > 0) {
            // Busca as últimas cargas registradas para os exercícios da ficha
            const nomesExercicios = ficha.exercicios.map(ex => ex.exercicio);
            const { data: ultimasCargas, error: cargasError } = await _supabase
                .from("treinos_realizados")
                .select("exercicio_nome, carga_kg")
                .eq("aluno_id", alunoAtual.id)
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

            fichaContentDiv.innerHTML = "";
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
            fichaContentDiv.innerHTML = '<div class="empty-state">Esta ficha não possui exercícios.</div>';
            btnSalvarCargas.style.display = "none";
        }
    }

    /**
     * ✅ FUNÇÃO CORRIGIDA: Realiza o login do usuário, buscando o aluno e TODAS suas fichas.
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

        // 2. ✅ CORREÇÃO: Buscar TODAS as fichas (sem .limit(1))
        const { data: fichas, error: fichaError } = await _supabase
            .from("planos_de_treino")
            .select("*")
            .eq("user_id", aluno.id)
            .order("data_troca", { ascending: false }); // ← Removido o .limit(1)

        if (fichaError) {
            console.error("Erro ao buscar as fichas de treino:", fichaError);
            // O login continua mesmo com erro na ficha, a tela mostrará o estado vazio.
        }

        btnEntrar.disabled = false;
        btnEntrar.textContent = "Entrar";

        sessionStorage.setItem("alunoLogadoId", aluno.id);
        mostrarFichas(aluno, fichas);
    }

    /**
     * Realiza o logout do usuário, limpando a sessão.
     */
    function logout() {
        alunoAtual = null;
        fichasDoAluno = [];
        fichaAtualIndex = 0;
        sessionStorage.removeItem("alunoLogadoId");
        loginScreen.classList.add("active");
        workoutScreen.classList.remove("active");
        credencialInput.value = "";
    }

    /**
     * ✅ FUNÇÃO CORRIGIDA: Salva as cargas da ficha atual
     */
    async function salvarCargas() {
        if (!alunoAtual || fichasDoAluno.length === 0) return;

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
     * ✅ FUNÇÃO CORRIGIDA: Verifica se há uma sessão ativa e carrega TODAS as fichas do aluno.
     */
    async function verificarSessao() {
        const alunoId = sessionStorage.getItem("alunoLogadoId");
        if (alunoId) {
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
                // 2. ✅ CORREÇÃO: Buscar TODAS as fichas (sem .limit(1))
                const { data: fichas, error: fichaError } = await _supabase
                    .from("planos_de_treino")
                    .select("*")
                    .eq("user_id", aluno.id)
                    .order("data_troca", { ascending: false }); // ← Removido o .limit(1)
                
                if (fichaError) {
                    console.error("Erro ao buscar fichas na verificação de sessão:", fichaError);
                }

                mostrarFichas(aluno, fichas);
            } else {
                console.error("Erro ao verificar sessão, aluno não encontrado:", alunoError);
                logout();
            }
        }
    }

    // --- 3. ADIÇÃO DOS EVENT LISTENERS ---
    btnEntrar.addEventListener("click", login);
    btnSair.addEventListener("click", logout);
    btnSalvarCargas.addEventListener("click", salvarCargas);
    credencialInput.addEventListener("keyup", (event) => {
        if (event.key === "Enter") {
            login();
        }
    });

    // --- 4. INICIALIZAÇÃO ---
    verificarSessao();
    console.log("App do Aluno pronto e ouvintes de eventos adicionados.");
});
