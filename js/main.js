class MainNoteList {
     constructor() {
         this.notes = [];
         this.apiUrl = 'https://jsonplaceholder.typicode.com/todos';
         this.container = document.querySelector('.noteList');

         this.currentFilter = localStorage.getItem('completeFilter') || 'ALL';

         this.taskFilter =  document.querySelector('.taskFilter');
         this.taskFilterTrigger = document.querySelector('.taskFilter__trigger');

         this.modal = document.querySelector('.addNoteModal');
         this.modalTitle = document.querySelector('.modalContent__title');

         this.isEditing = false;
         this.editingNoteId = null;
         this.titleInput = null;

         this.addButton = document.querySelector('.mainBody__addNote');
         this.cancelButton = document.querySelector('.modalButtons__cancel');
         this.applyButton = document.querySelector('.modalButtons__apply');

         this.loadingDots = document.querySelector('.loadingDots');

         this.initialize();
     }

     async initialize() {
         try {
             await this.loadNotes();
             this.attachEventListeners();
         } catch(error) {
             console.error('Ошибка инициализации:', error);
         }
     }

     async loadNotes() {
         this.isLoading();

         try {
             const response = await fetch(`${this.apiUrl}/?_limit=5&_page=1`);
             if (!response.ok) {
                 throw new Error(`HTTP ${response.status}: ${response.statusText}`);
             }

             this.notes = await response.json();

             this.container.innerHTML += this.notes
                 .map((note) => this.createNote(note.title, note.id, note.completed))
                 .join('');

             this.applyFilter();

             this.taskFilterTrigger.textContent = this.currentFilter.toUpperCase();

             requestAnimationFrame(() => {
                 this.checkListIsEmpty();
                 this.renderSeparators();
             });

             this.isLoading(false);
         } catch (error) {
             console.error('Ошибка загрузки заметок:', error);
         }
    }

    createNote(title, index, completed, asDOM = false) {
        const html = `
            <li class="note" id="${index}">
                <div class="note__noteItem ${completed ? 'note__noteItem_isChecked' : ''}">
                    <span class="note__noteCheckbox"></span>
                    <h3 class="note__labelName">${title}</h3>
                    <div class="note__options"> 
                        <button class="note__buttonEdit"></button>
                        <button class="note__buttonDelete"></button>
                    </div>
                </div>
            </li>
        `;

        if (asDOM) {
            const temp = document.createElement('div');
            temp.innerHTML = html;
            return temp.firstElementChild;
        }

        return html;
    }

    attachEventListeners() {
        this.taskFilter.addEventListener('click', (e) => {

            // Открытие + закрытие фильтра
            if (e.target.matches('.taskFilter__trigger')) {
                this.toggleFilter();
            }

            // Выбор фильтра
            else if(e.target.classList.contains('taskFilter__option')) {
                this.currentFilter = e.target.textContent;
                this.taskFilterTrigger.textContent = this.currentFilter.toUpperCase();

                localStorage.setItem('completeFilter', this.currentFilter);

                this.applyFilter();

                //Обновление разделителей
                requestAnimationFrame(() => {
                    this.checkListIsEmpty();
                    this.renderSeparators();
                });

                this.closeFilter();
            }
            else this.closeFilter();
        });



         //Смена выполнености + редактирование + удаление
        this.container.addEventListener('click', (e) => {

            const eventElement = e.target;

            //Редактирование заметки
            if (eventElement.matches('.note__buttonEdit')) {
                this.openModal(true, eventElement.closest('.note').id, eventElement.closest('.note').querySelector('.note__labelName').textContent)
            }

            //Удаление заметки
             else if (eventElement.matches('.note__buttonDelete')) {
                 const deleteNoteId = eventElement.closest('.note').id;
                 document.getElementById(deleteNoteId).remove();

                this.updateDeleteNote(deleteNoteId);

                this.notes = this.notes.filter(note => note.id != deleteNoteId);

                 requestAnimationFrame(() => {
                     this.checkListIsEmpty();
                     this.renderSeparators();
                 });
            }

             //Смена класса выполненности
             else {
                const noteId = eventElement.closest('.note').id;
                const noteIsDone = eventElement.closest('.note__noteItem').classList.contains('note__noteItem_isChecked')

                this.updateNoteIsDone(noteId, noteIsDone);

                e.target.closest('.note__noteItem').classList.toggle('note__noteItem_isChecked');
            }
        })


        // Открытие модального + обработка модального
        this.addButton.addEventListener('click', () => this.openModal());
        this.cancelButton.addEventListener('click', () => this.closeModal());
        this.applyButton.addEventListener('click', () => this.modalApply())
    }

    async updateNoteIsDone(id, done) {
        try {
            await fetch(`${this.apiUrl}/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json;charset=utf-8'
                },
                body: JSON.stringify({
                    completed: !done
                })
            }).then(response =>  { if (!response.ok) throw new Error(response.status) })
        } catch (error) {
            console.error(error);
        }
    }

    checkListIsEmpty() {
        const visibleNotes = Array.from(
            this.container.querySelectorAll('.note:not(.note_hidden)')
        );

        this.container.querySelector('.noteList__listIsEmpty').style.display = (visibleNotes.length === 0) ? 'flex' : 'none';
    }

    applyFilter() {
        this.container.querySelectorAll('.note').forEach(note => {
            const isCompleted = note.querySelector('.note__noteItem').classList.contains('note__noteItem_isChecked');

            switch(this.currentFilter) {
                case 'All':
                    note.classList.remove('note_hidden')
                    break;
                case 'Complete':
                    note.classList.toggle('note_hidden', !isCompleted);
                    break;
                case 'Incomplete':
                    note.classList.toggle('note_hidden', isCompleted);
                    break;
            }
        });
    }

    renderSeparators() {
        this.container.querySelectorAll('.noteList__separator').forEach(sepElem => sepElem.remove());
        const visibleNotes = Array.from(
            this.container.querySelectorAll('.note:not(.note_hidden)')
        );

        visibleNotes.slice(1).forEach(note => {
            const separator = document.createElement('div');
            separator.className = 'noteList__separator';
            note.prepend(separator);
        });
    }


    openFilter() {
        this.taskFilterTrigger.setAttribute('aria-expanded', 'true')
    }

    closeFilter() {
        this.taskFilterTrigger.setAttribute('aria-expanded', 'false')
    }

    toggleFilter() {
        const isExpanded = this.taskFilterTrigger.getAttribute('aria-expanded') === 'true';
        isExpanded ? this.closeFilter() : this.openFilter();
    }

    openModal(isEditing = false, id, noteForEdit) {
        this.modal.classList.remove('addNoteModal_hidden');

        this.titleInput = document.querySelector('.modalContent__inputNote');

        this.modalTitle.textContent = isEditing ? 'EDIT NOTE' : 'NEW NOTE';

        // Редактирование
        if (isEditing) {
            this.titleInput.removeEventListener('input', this.saveInputValue);

            this.isEditing = true;
            this.editingNoteId = id;
            this.titleInput.value = noteForEdit;
        }

        // Добавление
        else {
            this.isEditing = false;
            this.editingNoteId = null;
            this.titleInput.value = localStorage.getItem('inputNote') || '';

            // Сохранение ввода
            this.titleInput.addEventListener('input', this.saveInputValue);
        }
    }

    saveInputValue(e) {
        localStorage.setItem('inputNote', e.target.value);
    }

     modalApply() {
        if (!this.titleInput.value) {
            this.titleInput.classList.toggle('modalContent__inputNote_invalid')
            setTimeout(() => {
                this.titleInput.classList.toggle('modalContent__inputNote_invalid')
                }, 1000);
            this.titleInput.focus();
            return;
        }

         // Редактирование
        if (this.isEditing && this.editingNoteId) {
            document.getElementById(this.editingNoteId).querySelector('.note__labelName').textContent = this.titleInput.value;
            this.updateNoteTitle(this.editingNoteId, this.titleInput.value);
        }

        // Добавление
        else {
            const newId = this.notes.at(-1).id + 1 || 1;
            const newNote = this.createNote(this.titleInput.value, newId, false, true);
            this.container.appendChild(newNote);

            this.notes.push({
                userId: 1,
                id: newId,
                title: this.titleInput.value,
                completed: false
            });

            localStorage.removeItem('inputNote');

            this.updateNewNote(newId, this.titleInput.value);

            requestAnimationFrame(() => {
                this.renderSeparators();
                this.checkListIsEmpty();
            });
        }

        this.titleInput.value = '';
        this.closeModal();
    }

    async updateDeleteNote(id) {
        try {
            await fetch(`${this.apiUrl}/${id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json;charset=utf-8'
                }
            }).then(response =>  { if (!response.ok) throw new Error(response.status) })
        } catch (error) {
            console.error(error);
        }
    }

    async updateNoteTitle(id, note) {
        try {
            await fetch(`${this.apiUrl}/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json;charset=utf-8'
                },
                body: JSON.stringify({
                    title: note
                })
            }).then(response =>  { if (!response.ok) throw new Error(response.status) })
        } catch (error) {
            console.error(error);
        }
    }

    async updateNewNote(id, note) {
        try {
            await fetch(`${this.apiUrl}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json;charset=utf-8'
                },
                body: JSON.stringify({
                    userId: 1,
                    id: id,
                    title: note,
                    completed: false

                })
            }).then(response =>  { if (!response.ok) throw new Error(response.status) })
        } catch (error) {
            console.error(error);
        }
    }

    closeModal() {
        this.modal.classList.add('addNoteModal_hidden');
    }

    isLoading(load = true) {
        this.loadingDots.classList.toggle('loadingDots_hidden', !load);
    }

};

new MainNoteList();