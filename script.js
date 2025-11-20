document.addEventListener('DOMContentLoaded', () => {
    // --- SELETORES DO DOM ---
    const catalogContainer = document.getElementById('dunk-catalog');
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    const filtersContainer = document.getElementById('filters-container');
    const rankingList = document.getElementById('ranking-list');
    const modal = document.getElementById('modal');
    const modalBody = document.getElementById('modal-body');
    const modalCloseBtn = document.getElementById('modal-close-btn');

    // --- OBSERVER PARA ANIMAÇÃO DE ENTRADA ---
    const cardObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1 // O card é considerado visível quando 10% dele está na tela
    });

    // --- ESTADO DA APLICAÇÃO ---
    let allDunks = [];
    let currentFilter = 'all';    

    // --- INICIALIZAÇÃO ---
    async function initialize() {
        try {
            const response = await fetch('data.json');
            if (!response.ok) throw new Error('Network response was not ok');
            allDunks = await response.json();
            
            renderDunks(allDunks);
            populateRanking();
            setupEventListeners();
        } catch (error) {
            console.error('Falha ao carregar os dados das enterradas:', error);
            catalogContainer.innerHTML = '<p class="error-message">Não foi possível carregar o catálogo de enterradas. Tente novamente mais tarde.</p>';
        }
    }

    // --- RENDERIZAÇÃO ---
    function renderDunks(dunks) {
        // Remove o skeleton wrapper se ele existir
        const skeleton = catalogContainer.querySelector('.skeleton-wrapper');
        if (skeleton) {
            skeleton.remove();
        }

        catalogContainer.innerHTML = '';
        if (dunks.length === 0) {
            catalogContainer.innerHTML = '<p class="no-results-message">Nenhuma enterrada encontrada com os critérios selecionados.</p>';
            return;
        }

        dunks.forEach(dunk => {
            const card = document.createElement('article');
            card.className = 'dunk-card';
            card.dataset.id = dunk.id;
            card.innerHTML = `
                <div class="card-image" style="background-image: url('${dunk.imagem}')"></div>
                <div class="card-content">
                    <h3 class="card-title">${dunk.nome}</h3>
                    <p class="card-player">${dunk.jogador} (${dunk.ano})</p>
                    <div class="card-difficulty">
                        ${'★'.repeat(dunk.dificuldade)}${'☆'.repeat(5 - dunk.dificuldade)}
                    </div>
                </div>
            `;
            catalogContainer.appendChild(card);
            observeCard(card); // Adiciona o card ao observer
            add3dEffect(card); // Adiciona o efeito 3D interativo
        });
    }

    function populateRanking() {
        // Top 5 baseado na dificuldade e fama (aqui simplificado pelos IDs iniciais)
        const topDunks = allDunks.filter(dunk => [1, 2, 3, 4, 5].includes(dunk.id));
        rankingList.innerHTML = topDunks
            .map(dunk => `<li><span>${dunk.jogador}</span> - ${dunk.nome} (${dunk.ano})</li>`)
            .join('');
    }

    // --- LÓGICA DE FILTRAGEM E BUSCA ---
    function applyFilters() {
        const searchTerm = searchInput.value.toLowerCase().trim();
        
        let filteredDunks = allDunks.filter(dunk => {
            const matchesSearch = searchTerm === '' ||
                dunk.nome.toLowerCase().includes(searchTerm) ||
                dunk.jogador.toLowerCase().includes(searchTerm) ||
                dunk.ano.toString().includes(searchTerm);

            const matchesFilter = currentFilter === 'all' || dunk.tags.includes(currentFilter);

            return matchesSearch && matchesFilter;
        });

        renderDunks(filteredDunks);
    }

    // --- MODAL ---
    function openModal(dunkId) {
        const dunk = allDunks.find(d => d.id === parseInt(dunkId));
        if (!dunk) return;

        modalBody.innerHTML = `
            ${dunk.videoUrl ? 
                `<div class="modal-video-container">
                    <iframe src="${dunk.videoUrl}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
                </div>` : 
                `<img src="${dunk.imagem}" alt="Imagem da enterrada ${dunk.nome}" class="modal-img" loading="lazy">`}
            <h2 class="modal-title">${dunk.nome}</h2>
            <h3 class="modal-player">${dunk.jogador} - ${dunk.ano}</h3>
            <div class="modal-difficulty">
                <strong>Dificuldade:</strong> ${'★'.repeat(dunk.dificuldade)}${'☆'.repeat(5 - dunk.dificuldade)}
            </div>
            <p class="modal-description">${dunk.descricao}</p>
        `;
        modal.classList.add('visible');
        document.body.style.overflow = 'hidden'; // Impede o scroll do fundo
    }

    function closeModal() {
        modal.classList.remove('visible');
        document.body.style.overflow = ''; // Restaura o scroll
    }

    function observeCard(card) {
        cardObserver.observe(card);
    }

    // --- EFEITO 3D INTERATIVO NOS CARDS ---
    function add3dEffect(card) {
        const intensity = 8; // Quão forte será o efeito de inclinação (reduzido para suavizar)

        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const centerX = card.offsetWidth / 2;
            const centerY = card.offsetHeight / 2;

            const rotateX = ((y - centerY) / centerY) * -intensity;
            const rotateY = ((x - centerX) / centerX) * intensity;

            // Aplica a transformação 3D e um leve scale para destacar
            card.style.transition = 'transform 0.1s ease-out'; // Transição rápida para seguir o mouse
            card.style.transform = `translateY(-5px) perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.03)`;
        });

        card.addEventListener('mouseleave', () => {
            // Retorna o card à sua posição original de forma suave
            card.style.transition = 'transform 0.4s ease-in-out';
            card.style.transform = `translateY(0) perspective(1000px) rotateX(0) rotateY(0) scale(1)`;
        });
    }

    // --- EVENT LISTENERS ---
    function setupEventListeners() {
        // Busca em tempo real
        searchInput.addEventListener('input', applyFilters);

        // Busca por clique no botão
        searchButton.addEventListener('click', applyFilters);

        // Filtros por botão
        filtersContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('filter-btn')) {
                document.querySelector('.filter-btn.active').classList.remove('active');
                e.target.classList.add('active');
                currentFilter = e.target.dataset.filter;
                applyFilters();
            }
        });

        // Abrir modal ao clicar no card
        catalogContainer.addEventListener('click', (e) => {
            const card = e.target.closest('.dunk-card');
            if (card) {
                openModal(card.dataset.id);
            }
        });

        // Fechar modal
        modalCloseBtn.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) { // Fecha se clicar fora do conteúdo
                closeModal();
            }
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('visible')) {
                closeModal();
            }
        });
    }

    // --- INICIA A APLICAÇÃO ---
    initialize();
});