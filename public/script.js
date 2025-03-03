
        // URL base da API
        const API_URL = 'http://localhost:3000';
        
        // Referências aos elementos DOM
        const collectionsGrid = document.getElementById('collectionsGrid');
        const tasksContent = document.getElementById('tasksContent');
        const collectionTitle = document.getElementById('collectionTitle');
        const activeColorDot = document.getElementById('activeColorDot');
        const backButton = document.getElementById('backButton');
        const taskInput = document.querySelector('.task-input');
        const addButton = document.querySelector('.add-button');
        const taskList = document.querySelector('.task-list');
        const editCollectionButton = document.getElementById('editCollectionButton');
        const deleteCollectionButton = document.getElementById('deleteCollectionButton');
        
        // Elementos dos modais
        const collectionModal = document.getElementById('collectionModal');
        const confirmModal = document.getElementById('confirmModal');
        const modalTitle = document.getElementById('modalTitle');
        const closeButtons = document.querySelectorAll('.close-button');
        const cancelButtons = document.querySelectorAll('.cancel-button');
        const saveCollectionButton = document.getElementById('saveCollectionButton');
        const confirmDeleteButton = document.getElementById('confirmDeleteButton');
        const listNameInput = document.getElementById('listName');
        const collectionNameInput = document.getElementById('collectionName');
        const colorOptions = document.getElementById('colorOptions');
        
        // Estado da aplicação
        let currentCollection = '';
        let collections = [];
        let collectionsInfo = [];
        let colors = [];
        let selectedColor = '';
        let isEditing = false;
        let darkMode = localStorage.getItem('darkMode') === 'true';
        const themeToggle = document.getElementById('themeToggle');
        const resetDailySwitch = document.getElementById('resetDailySwitch');

        // Carregar todas as collections disponíveis ao iniciar
        document.addEventListener('DOMContentLoaded', () => {
            fetchColors();
            fetchCollections();

            // Inicializar modo escuro
                if (darkMode) {
             document.body.classList.add('dark-mode');
             themeToggle.textContent = '☀️';
            }

            // Event listener para alternar modo escuro
            themeToggle.addEventListener('click', () => {
            darkMode = !darkMode;
            localStorage.setItem('darkMode', darkMode);
             document.body.classList.toggle('dark-mode');
            themeToggle.textContent = darkMode ? '☀️' : '🌙';
            });
            
            // Event listeners para navegação
            backButton.addEventListener('click', showCollectionsGrid);
            
            // Event listener para adicionar tarefa
            addButton.addEventListener('click', addTask);
            
            // Event listener para adicionar tarefa com Enter
            taskInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    addTask();
                }
            });
            
            // Event listeners para botões de edição e exclusão
            editCollectionButton.addEventListener('click', () => openCollectionModal(true));
            deleteCollectionButton.addEventListener('click', openConfirmModal);
            
            // Event listeners para modais
            closeButtons.forEach(button => {
                button.addEventListener('click', function() {
                    const modal = this.closest('.modal');
                    closeModal(modal);
                });
            });
            
            cancelButtons.forEach(button => {
                button.addEventListener('click', function() {
                    const modal = this.closest('.modal');
                    closeModal(modal);
                });
            });
            
            saveCollectionButton.addEventListener('click', saveCollection);
            confirmDeleteButton.addEventListener('click', deleteCollection);
            
            // Fechar modais se clicar fora
            window.addEventListener('click', (e) => {
                if (e.target === collectionModal) {
                    closeModal(collectionModal);
                } else if (e.target === confirmModal) {
                    closeModal(confirmModal);
                }
            });
            
            // Automaticamente converter o nome da lista para nome de collection
            listNameInput.addEventListener('input', () => {
                if (!isEditing) {
                    const listName = listNameInput.value;
                    // Converter para minúsculas e remover espaços/caracteres especiais
                    collectionNameInput.value = listName
                        .toLowerCase()
                        .replace(/[^a-z0-9]/g, '')
                        .trim();
                }
            });

            // Event listener para o switch de reset diário
            resetDailySwitch.addEventListener('change', async () => {
                if (!currentCollection) return;
    
                try {
            const response = await fetch(`${API_URL}/collections/${currentCollection}/resetDaily`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                resetDaily: resetDailySwitch.checked 
            })
        });
        
                if (!response.ok) {
                 throw new Error('Erro ao atualizar opção de reset diário');
        }
                 } catch (error) {
                console.error('Erro:', error);
                alert('Falha ao atualizar opção de reset diário.');
            resetDailySwitch.checked = !resetDailySwitch.checked; // reverter alteração
         }
        });

        });
        
        // Função para buscar cores disponíveis
        async function fetchColors() {
            try {
                const response = await fetch(`${API_URL}/colors`);
                
                if (!response.ok) {
                    throw new Error('Erro ao carregar cores');
                }
                
                const data = await response.json();
                colors = data.colors;
                
                // Preencher opções de cores
                populateColorOptions();
            } catch (error) {
                console.error('Erro:', error);
                alert('Falha ao carregar as cores disponíveis.');
            }
        }
        
        // Função para preencher opções de cores
        function populateColorOptions() {
            colorOptions.innerHTML = '';
            
            colors.forEach(color => {
                const colorOption = document.createElement('div');
                colorOption.className = 'color-option';
                colorOption.style.backgroundColor = color;
                colorOption.dataset.color = color;
                
                if (color === selectedColor) {
                    colorOption.classList.add('selected');
                }
                
                colorOption.addEventListener('click', () => {
                    // Remover seleção atual
                    const selectedOptions = colorOptions.querySelectorAll('.selected');
                    selectedOptions.forEach(option => option.classList.remove('selected'));
                    
                    // Adicionar nova seleção
                    colorOption.classList.add('selected');
                    selectedColor = color;
                });
                
                colorOptions.appendChild(colorOption);
            });
        }
        
        // Função para buscar todas as collections disponíveis
        async function fetchCollections() {
            try {
                const response = await fetch(`${API_URL}/collections`);
                
                if (!response.ok) {
                    throw new Error('Erro ao carregar collections');
                }
                
                const data = await response.json();
                collections = data.collections;
                collectionsInfo = data.collectionsInfo;
                
                // Atualizar a grade de collections
                renderCollectionsGrid();
            } catch (error) {
                console.error('Erro:', error);
                alert('Falha ao carregar as listas disponíveis.');
            }
        }
        
        // Função para renderizar a grade de collections
        function renderCollectionsGrid() {
            collectionsGrid.innerHTML = '';
            
            // Renderizar cada collection como um card
            collectionsInfo.forEach(info => {
                createCollectionCard(info);
            });
            
            // Adicionar card para nova collection
            const newCollectionCard = document.createElement('div');
            newCollectionCard.className = 'collection-card new-collection-card';
            newCollectionCard.innerHTML = `
                <div class="new-collection-icon">+</div>
                <div>Nova Lista</div>
            `;
            
            newCollectionCard.addEventListener('click', () => openCollectionModal(false));
            
            collectionsGrid.appendChild(newCollectionCard);
        }
        
        // Função para criar um card de collection
        function createCollectionCard(info) {
            const card = document.createElement('div');
            card.className = 'collection-card';
            card.dataset.collection = info.name;
            card.style.backgroundColor = info.color;
    
        // Calcular o contraste para determinar a cor do texto
            const rgb = hexToRgb(info.color);
            const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
            const textColor = brightness > 128 ? '#000' : '#fff';
            card.style.color = textColor;
    
              if (info.name === currentCollection) {
            card.classList.add('active');
        }
    
        // Buscar contagem de tarefas para esta collection
            fetch(`${API_URL}/tarefas/${info.name}`)
            .then(response => response.json())
            .then(tasks => {
            const taskCount = tasks.length;
            const pendingTasks = tasks.filter(task => !task.concluida).length;
            
            card.innerHTML = `
                <div class="collection-name">${info.displayName}</div>
                <div class="collection-task-count">${pendingTasks} pendente${pendingTasks !== 1 ? 's' : ''} de ${taskCount}</div>
            `;
        })
        .catch(error => {
            console.error('Erro ao buscar tarefas:', error);
            card.innerHTML = `
                <div class="collection-name">${info.displayName}</div>
                <div class="collection-task-count">0 pendentes de 0</div>
            `;
        });
    
        // Event listener para abrir a collection
            card.addEventListener('click', () => {
            currentCollection = info.name;
            openCollection(info);
         });
    
            collectionsGrid.appendChild(card);
        }

        
        // Função para mostrar a grade de collections
        function showCollectionsGrid() {
            tasksContent.style.display = 'none';
            collectionsGrid.style.display = 'grid';
            currentCollection = '';
        }
        
        // Função para abrir uma collection
        function openCollection(info) {
        collectionsGrid.style.display = 'none';
        tasksContent.style.display = 'block';
    
            // Atualizar título e cor
        collectionTitle.textContent = info.displayName;
        activeColorDot.style.backgroundColor = info.color;
    
            // Atualizar o switch de reset diário
        resetDailySwitch.checked = info.resetDaily || false;
    
            // Carregar tarefas
        loadTasks();
        }
        
        // Função para abrir o modal de criação/edição de collection
        function openCollectionModal(editing) {
        isEditing = editing;
    
            if (editing) {
            if (!currentCollection) {
                alert('Nenhuma lista selecionada.');
            return;
        }
        
           // Buscar informações atuais da collection
            const info = collectionsInfo.find(c => c.name === currentCollection);
        
            modalTitle.textContent = 'Editar Lista de Tarefas';
            listNameInput.value = info.displayName;
            collectionNameInput.value = info.name;
            collectionNameInput.disabled = true; // Não permitir alterar o nome da collection
            selectedColor = info.color;
        } else {
            modalTitle.textContent = 'Nova Lista de Tarefas';
            listNameInput.value = '';
            collectionNameInput.value = '';
            collectionNameInput.disabled = false;
            selectedColor = colors[0];
        }
    
        // Preencher opções de cores
        populateColorOptions();
    
        // Mostrar modal
            collectionModal.classList.add('active');
            listNameInput.focus();
        }
        // Função auxiliar para converter cor hex para RGB
        function hexToRgb(hex) {
            // Expandir formato abreviado (ex: #03F) para completo (ex: #0033FF)
            const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
            hex = hex.replace(shorthandRegex, function(m, r, g, b) {
            return r + r + g + g + b + b;
        });
    
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
                } : { r: 0, g: 0, b: 0 };
        }
        
        // Função para abrir o modal de confirmação de exclusão
        function openConfirmModal() {
            if (!currentCollection) {
                alert('Nenhuma lista selecionada.');
                return;
            }
            
            confirmModal.classList.add('active');
        }
        
        // Função para fechar um modal
        function closeModal(modal) {
            modal.classList.remove('active');
        }
        
        // Função para salvar uma collection (criar ou editar)
        async function saveCollection() {
            const displayName = listNameInput.value.trim();
            const collectionName = collectionNameInput.value.trim();
            
            if (!displayName || (!isEditing && !collectionName)) {
                alert('Por favor, preencha todos os campos.');
                return;
            }
            
            try {
                let response;
                
                if (isEditing) {
                    // Atualizar collection existente
                    response = await fetch(`${API_URL}/collections/${currentCollection}`, {
                        method: 'PATCH',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ 
                            displayName,
                            color: selectedColor
                        })
                    });
                } else {
                    // Verificar se o nome já existe
                    if (collections.includes(collectionName)) {
                        alert('Este nome de collection já existe. Por favor, escolha outro.');
                        return;
                    }
                    
                    // Criar nova collection
                    response = await fetch(`${API_URL}/collections`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ 
                            collectionName, 
                            displayName,
                            color: selectedColor
                        })
                    });
                }
                
                if (!response.ok) {
                    throw new Error('Erro ao salvar collection');
                }
                
                // Buscar collections atualizadas
                await fetchCollections();
                
                if (isEditing) {
                    // Atualizar interface da collection atual
                    const updatedInfo = collectionsInfo.find(c => c.name === currentCollection);
                    collectionTitle.textContent = updatedInfo.displayName;
                    activeColorDot.style.backgroundColor = updatedInfo.color;
                } else {
                    // Abrir a nova collection
                    currentCollection = collectionName;
                    const newInfo = collectionsInfo.find(c => c.name === collectionName);
                    openCollection(newInfo);
                }
                
                // Fechar o modal
                closeModal(collectionModal);
            } catch (error) {
                console.error('Erro:', error);
                alert('Falha ao salvar lista de tarefas.');
            }
        }
        
        // Função para excluir uma collection
        async function deleteCollection() {
            try {
                const response = await fetch(`${API_URL}/collections/${currentCollection}`, {
                    method: 'DELETE'
                });
                
                if (!response.ok) {
                    throw new Error('Erro ao excluir collection');
                }
                
                // Fechar o modal
                closeModal(confirmModal);
                
                // Buscar collections atualizadas
                await fetchCollections();
                
                // Voltar para a visualização de collections
                showCollectionsGrid();
            } catch (error) {
                console.error('Erro:', error);
                alert('Falha ao excluir lista de tarefas.');
            }
        }
        
        // Função para carregar tarefas da collection atual
        async function loadTasks() {
            try {
                const response = await fetch(`${API_URL}/tarefas/${currentCollection}`);
                
                if (!response.ok) {
                    throw new Error('Erro ao carregar tarefas');
                }
                
                const tasks = await response.json();
                
                // Limpar lista atual
                taskList.innerHTML = '';
                
                // Verificar se há tarefas
                if (tasks.length === 0) {
                    taskList.innerHTML = '<div class="empty-message">Nenhuma tarefa encontrada</div>';
                    return;
                }
                
                // Renderizar tarefas
                tasks.forEach(task => {
                    renderTask(task);
                });
            } catch (error) {
                console.error('Erro:', error);
                alert('Falha ao carregar tarefas. Verifique se o servidor está rodando.');
            }
        }
        
        // Função para adicionar uma nova tarefa
        async function addTask() {
         const description = taskInput.value.trim();
    
         if (!description) {
        alert('Por favor, insira uma descrição para a tarefa.');
        return;
         }
    
        try {
        const response = await fetch(`${API_URL}/tarefas/${currentCollection}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ descricao: description })
        });
        
        if (!response.ok) {
            throw new Error('Erro ao adicionar tarefa');
        }
        
        const newTask = await response.json();
        
        // Limpar campo de entrada
        taskInput.value = '';
        
        // Remover mensagem de vazio se existir
        const emptyMessage = document.querySelector('.empty-message');
        if (emptyMessage) {
            emptyMessage.remove();
        }
        
        // Renderizar nova tarefa
        renderTask(newTask);
        
        // Atualizar informações da collection na grid
        await updateCollectionInfo(currentCollection);
        } catch (error) {
        console.error('Erro:', error);
        alert('Falha ao adicionar tarefa.');
        }
        }

        // Função para atualizar informações de uma collection específica na grid
        async function updateCollectionInfo(collectionName) {
            try {
        // Buscar informações da collection
        const infoResponse = await fetch(`${API_URL}/collections/${collectionName}`);
            if (!infoResponse.ok) throw new Error('Erro ao buscar informações da collection');
        const info = await infoResponse.json();
        
        // Buscar tarefas da collection
        const tasksResponse = await fetch(`${API_URL}/tarefas/${collectionName}`);
            if (!tasksResponse.ok) throw new Error('Erro ao buscar tarefas da collection');
        const tasks = await tasksResponse.json();
        
        // Atualizar informações no card se ele existir na grid
        const card = collectionsGrid.querySelector(`[data-collection="${collectionName}"]`);
            if (card) {
            const taskCount = tasks.length;
            const pendingTasks = tasks.filter(task => !task.concluida).length;
            
            const nameEl = card.querySelector('.collection-name');
            const countEl = card.querySelector('.collection-task-count');
            
            if (nameEl) nameEl.textContent = info.displayName;
            if (countEl) countEl.textContent = `${pendingTasks} pendente${pendingTasks !== 1 ? 's' : ''} de ${taskCount}`;
        }
            } catch (error) {
            console.error('Erro ao atualizar informações da collection:', error);
        }
        }
        
        // Função para marcar uma tarefa como concluída/não concluída
        async function toggleTaskStatus(id, completed) {
            try {
            const response = await fetch(`${API_URL}/tarefas/${currentCollection}/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ concluida: !completed })
            });
        
            if (!response.ok) {
            throw new Error('Erro ao atualizar tarefa');
            }
        
            // Recarregar tarefas para atualizar a interface
             loadTasks();
        
            // Atualizar informações da collection na grid
            await updateCollectionInfo(currentCollection);
            }catch (error) {
            console.error('Erro:', error);
            alert('Falha ao atualizar tarefa.');
            }
        }
        
        // Função para excluir uma tarefa
        async function deleteTask(id) {
                if (!confirm('Tem certeza que deseja excluir esta tarefa?')) {
             return;
             }
    
                try {
            const response = await fetch(`${API_URL}/tarefas/${currentCollection}/${id}`, {
            method: 'DELETE'
            });
        
                if (!response.ok) {
            throw new Error('Erro ao excluir tarefa');
            }
        
        // Recarregar tarefas para atualizar a interface
        loadTasks();
        
        // Atualizar informações da collection na grid
            await updateCollectionInfo(currentCollection);
            } catch (error) {
            console.error('Erro:', error);
            alert('Falha ao excluir tarefa.');
            }
        }

        
        // Função para renderizar uma tarefa na interface
        function renderTask(task) {
            const taskItem = document.createElement('li');
            taskItem.classList.add('task-item');
            if (task.concluida) {
                taskItem.classList.add('completed');
            }
            
            const completeButtonText = task.concluida ? 'Desfazer' : 'Concluir';
            
            taskItem.innerHTML = `
                <span class="task-text">${task.descricao}</span>
                <div class="task-actions">
                    <button class="complete-button ${task.concluida ? 'completed' : ''}">${completeButtonText}</button>
                    <button class="delete-button">Excluir</button>
                </div>
            `;
            
            // Adicionar event listeners para os botões
            const completeButton = taskItem.querySelector('.complete-button');
            const deleteButton = taskItem.querySelector('.delete-button');
            
            completeButton.addEventListener('click', () => {
                toggleTaskStatus(task._id, task.concluida);
            });
            
            deleteButton.addEventListener('click', () => {
                deleteTask(task._id);
            });
            
            // Adicionar à lista
            taskList.appendChild(taskItem);
        }