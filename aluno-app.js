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

    // --- MAPEAMENTO DOS GIFS ---
    const gifMap = new Map();
    if (typeof exercicios !== 'undefined') {
        for (const exercicio of exercicios) {
            const chave = exercicio.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            gifMap.set(chave, exercicio.path);
        }
        console.log(`✅ ${gifMap.size} GIFs mapeados e prontos para uso.`);
    } else {
        console.error("A lista de exercícios (do arquivo exercicios.js) não foi encontrada.");
    }

    // --- DICIONÁRIO DE TÉCNICAS ---
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

    function encontrarGifUrl(nomeExercicio) {
        if (!nomeExercicio) return null;
        const chaveBusca = nomeExercicio.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        return gifMap.get(chaveBusca);
    }

    function criarNavegacaoFichas() {
        if (fichasDoAluno.length <= 1) return '';
        return `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; background: #fff; padding: 10px; border-radius: 8px;">
                <button id="ficha-anterior" ${fichaAtualIndex === 0 ? 'disabled' : ''} style="background: #3498db; color: white; border: none; padding: 8px 12px; border-radius: 5px; cursor: pointer;">← Anterior</button>
                <span style="font-weight: 600;">Ficha ${fichaAtualIndex + 1} de ${fichasDoAluno.length}</span>
                <button id="ficha-proximo" ${fichaAtualIndex === fichasDoAluno.length - 1 ? 'disabled' : ''} style="background: #3498db; color: white; border: none; padding: 8px 12px; border-radius: 5px; cursor: pointer;">Próxima →</button>
            </div>
        `;
    }

    // ==================================================================
    //  INÍCIO DAS MODIFICAÇÕES: Novas funções para renderização
    // ==================================================================

    // FUNÇÃO AUXILIAR: Cria o HTML para um único exercício.
    function criarElementoExercicio(exercicio, mapaCargas) {
        const exercicioElement = document.createElement("div");
        exercicioElement.className = "exercicio";
        exercicioElement.dataset.id = exercicio.id;

         const gifUrlFinal = exercicio.gif_url || encontrarGifUrl(exercicio.exercicio);
    
    // Monta o HTML do GIF. A URL para exercícios da IA já é completa, então não precisa do prefixo.
    const gifHtml = gifUrlFinal 
        ? `<img src="${gifUrlFinal.startsWith('http' ) ? gifUrlFinal : 'https://fitcraft-gifs-html.vercel.app' + gifUrlFinal}" alt="GIF do exercício ${exercicio.exercicio}" class="exercicio-gif" loading="lazy">` 
        : '';
        const descricaoTecnica = exercicio.tecnica ? (tecnicasDescricoes[exercicio.tecnica] || "" ) : "";
        // Não mostra a descrição da técnica se for de agrupamento, pois já estará no cabeçalho do grupo
        const htmlTecnica = (exercicio.tecnica && !exercicio.grupoTecnicaId) ? `<div class="exercicio-tecnica">Técnica: <strong>${exercicio.tecnica}</strong>${descricaoTecnica ? `<span> — ${descricaoTecnica}</span>` : ""}</div>` : "";
        
        // *** ADIÇÃO: HTML para observação do exercício ***
        const htmlObservacao = exercicio.observacao ? `<div class="exercicio-observacao"><strong>💡 Observação:</strong> ${exercicio.observacao}</div>` : "";
        
        const ultimaCarga = mapaCargas[exercicio.exercicio] || "";

        exercicioElement.innerHTML = `
            <div class="exercicio-header">
                <div class="exercicio-nome">${exercicio.exercicio}</div>
                ${gifHtml}
            </div>
            <div class="exercicio-detalhes"><span>Séries: <strong>${exercicio.series}</strong></span> <span>Repetições: <strong>${exercicio.repeticoes}</strong></span></div>
            ${htmlTecnica}
            ${htmlObservacao}
            <div class="carga-input"><label>Carga (kg):</label><input type="number" class="carga-valor" data-exercicio-nome="${exercicio.exercicio}" value="${ultimaCarga}" placeholder="0"></div>
        `;
        return exercicioElement;
    }

    // FUNÇÃO PRINCIPAL DE RENDERIZAÇÃO (VERSÃO ATUALIZADA)
    async function renderizarFichaAtual() {
        const ficha = fichasDoAluno[fichaAtualIndex];
        if (!ficha) {
            fichaContentDiv.innerHTML = '<div class="empty-state">Erro ao carregar ficha.</div>';
            return;
        }

        // --- Parte 1: Renderiza informações da ficha e navegação (sem alterações) ---
        const navegacao = criarNavegacaoFichas();
        const dataFormatada = new Date(ficha.data_troca).toLocaleDateString("pt-BR", { timeZone: "UTC" });
        fichaInfoDiv.innerHTML = navegacao + `
            <div style="background: #e8f6ef; color: #229954; padding: 15px; border-radius: 8px; font-weight: 500;">
                <p style="margin: 5px 0;"><strong>Ficha:</strong> ${ficha.name}</p>
                <p style="margin: 5px 0;"><strong>Data da Troca:</strong> ${dataFormatada}</p>
                ${ficha.observacoes ? `<p style="margin: 5px 0;"><strong>Observações:</strong> ${ficha.observacoes}</p>` : ""}
            </div>
        `;

        const btnAnterior = document.getElementById('ficha-anterior');
        const btnProximo = document.getElementById('ficha-proximo');
        if (btnAnterior) btnAnterior.addEventListener('click', () => { if (fichaAtualIndex > 0) { fichaAtualIndex--; renderizarFichaAtual(); } });
        if (btnProximo) btnProximo.addEventListener('click', () => { if (fichaAtualIndex < fichasDoAluno.length - 1) { fichaAtualIndex++; renderizarFichaAtual(); } });

        // --- Parte 2: Lógica de renderização dos exercícios (AQUI ESTÁ A MUDANÇA) ---
        if (ficha.exercicios && ficha.exercicios.length > 0) {
            // Busca as cargas (sem alterações)
            const nomesExercicios = ficha.exercicios.map(ex => ex.exercicio);
            const { data: ultimasCargas, error: cargasError } = await _supabase.from("treinos_realizados").select("exercicio_nome, carga_kg").eq("aluno_id", alunoAtual.id).in("exercicio_nome", nomesExercicios).order("data_treino", { ascending: false });
            if (cargasError) console.error("Erro ao buscar últimas cargas:", cargasError);
            const mapaCargas = {};
            if (ultimasCargas) {
                ultimasCargas.forEach(carga => { if (!mapaCargas[carga.exercicio_nome]) mapaCargas[carga.exercicio_nome] = carga.carga_kg; });
            }

            fichaContentDiv.innerHTML = ""; // Limpa a área
            const exerciciosProcessados = new Set(); // Controle para não renderizar duas vezes

            ficha.exercicios.forEach(exercicio => {
                if (exerciciosProcessados.has(exercicio.id)) return;

                // LÓGICA DE AGRUPAMENTO
                if (exercicio.grupoTecnicaId) {
                    const grupoDeExercicios = ficha.exercicios.filter(ex => ex.grupoTecnicaId === exercicio.grupoTecnicaId);
                    const groupContainer = document.createElement('div');
                    groupContainer.className = 'exercicio-group';
                    groupContainer.innerHTML = `<div class="group-header">${exercicio.tecnica}</div>`;

                    grupoDeExercicios.forEach(exDoGrupo => {
                        const exercicioElement = criarElementoExercicio(exDoGrupo, mapaCargas);
                        exercicioElement.classList.add('in-group');
                        groupContainer.appendChild(exercicioElement);
                        exerciciosProcessados.add(exDoGrupo.id);
                    });
                    fichaContentDiv.appendChild(groupContainer);
                } else {
                    // Renderiza exercício normal
                    const exercicioElement = criarElementoExercicio(exercicio, mapaCargas);
                    fichaContentDiv.appendChild(exercicioElement);
                    exerciciosProcessados.add(exercicio.id);
                }
            });

            btnSalvarCargas.style.display = "block";
        } else {
            fichaContentDiv.innerHTML = '<div class="empty-state">Esta ficha não possui exercícios.</div>';
            btnSalvarCargas.style.display = "none";
        }
    }

    // ==================================================================
    //  FIM DAS MODIFICAÇÕES
    // ==================================================================

    async function login() {
        const credencial = credencialInput.value.trim().toUpperCase();
        if (!credencial) {
            loginError.textContent = "Por favor, insira sua credencial.";
            return;
        }
        loginError.textContent = "";
        btnEntrar.disabled = true;
        btnEntrar.textContent = "Verificando...";

        const { data: aluno, error: alunoError } = await _supabase.from("clients").select("id, nome").eq("credencial", credencial).single();
        if (alunoError || !aluno) {
            btnEntrar.disabled = false;
            btnEntrar.textContent = "Entrar";
            loginError.textContent = "Credencial inválida. Verifique e tente novamente.";
            return;
        }

        const { data: fichas, error: fichaError } = await _supabase.from("planos_de_treino").select("*").eq("user_id", aluno.id).order("data_troca", { ascending: false });
        if (fichaError) console.error("Erro ao buscar as fichas de treino:", fichaError);

        btnEntrar.disabled = false;
        btnEntrar.textContent = "Entrar";
        sessionStorage.setItem("alunoLogadoId", aluno.id);
        mostrarFichas(aluno, fichas);
    }

    function logout() {
        alunoAtual = null;
        fichasDoAluno = [];
        fichaAtualIndex = 0;
        sessionStorage.removeItem("alunoLogadoId");
        loginScreen.classList.add("active");
        workoutScreen.classList.remove("active");
        credencialInput.value = "";
    }

    function mostrarFichas(aluno, fichas) {
        alunoAtual = aluno;
        fichasDoAluno = fichas || [];
        fichaAtualIndex = 0;

        alunoNomeSpan.textContent = `Olá, ${aluno.nome.split(' ')[0]}!`;

        loginScreen.classList.remove("active");
        workoutScreen.classList.add("active");

        if (fichasDoAluno.length > 0) {
            renderizarFichaAtual();
        } else {
            fichaInfoDiv.innerHTML = '';
            fichaContentDiv.innerHTML = '<div class="empty-state">Você ainda não tem nenhuma ficha de treino cadastrada.</div>';
            btnSalvarCargas.style.display = "none";
        }
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
        const { error } = await _supabase.from("treinos_realizados").upsert(registrosDeTreino, { onConflict: "aluno_id, exercicio_nome, data_treino" });
        btnSalvarCargas.disabled = false;
        btnSalvarCargas.textContent = "Salvar Cargas do Treino";

        if (error) {
            alert(`Ocorreu um erro ao salvar as cargas. Detalhes: ${error.message}`);
        } else {
            alert("Cargas do treino salvas com sucesso!");
        }
    }

    async function verificarSessao() {
        const alunoId = sessionStorage.getItem("alunoLogadoId");
        if (alunoId) {
            loginScreen.classList.remove("active");
            workoutScreen.classList.add("active");
            alunoNomeSpan.textContent = "Carregando...";
            fichaContentDiv.innerHTML = '<div class="empty-state">Verificando sessão...</div>';

            const { data: aluno, error: alunoError } = await _supabase.from("clients").select("id, nome").eq("id", alunoId).single();
            if (aluno && !alunoError) {
                const { data: fichas, error: fichaError } = await _supabase.from("planos_de_treino").select("*").eq("user_id", aluno.id).order("data_troca", { ascending: false });
                if (fichaError) console.error("Erro ao buscar fichas na verificação de sessão:", fichaError);
                mostrarFichas(aluno, fichas);
            } else {
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
});