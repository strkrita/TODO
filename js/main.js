class MainNoteList {
     constructor() {
         this.notes = [];
         this.apiUrl = 'https://jsonplaceholder.typicode.com/todos';
         this.container = document.querySelector('.noteList');

         this.currentFilter = localStorage.getItem('completeFilter') || 'ALL';

         this.modal = document.querySelector('.addNoteModal');
         this.isEditing = false;
         this.EditingNoteId = null;
         this.titleInput = null;

         this.initialize();
     }

     async initialize() {
         await this.loadNotes();
         this.attachEventListeners();
     }

     async loadNotes() {
         this.isLoading();

         this.notes = await fetch(`${this.apiUrl}/?_limit=5&_page=1`).then(r => r.json());

         this.container.innerHTML += this.notes
            .map((note) => this.createNote(note.title, note.id, note.completed))
            .join('');

         this.applyFilter();

         document.querySelector('.taskFilter__trigger').textContent = this.currentFilter.toUpperCase();

         requestAnimationFrame(() => {
            this.checkListIsEmpty();
            this.renderSeparators();
         });

         this.isLoading(false);
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
        document.querySelector('.taskFilter').addEventListener('click', (e) => {
            const trigger = document.querySelector('.taskFilter__trigger');
            const list = document.querySelector('.taskFilter__list');

            // Открытие + закрытие фильтра
            if (e.target == trigger) {
                if (trigger.getAttribute('aria-expanded') == 'true') {
                    this.closeFilter();
                } else {
                    this.openFilter();
                }
            }
            // Выбор фильтра
            else if(e.target.classList.contains('taskFilter__option')) {
                this.currentFilter = e.target.textContent;
                trigger.textContent = this.currentFilter.toUpperCase();

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

            let eventElement = e.target;

            //Редактирование заметки
            if (eventElement.matches('.note__buttonEdit')) {
                this.openModal(true, eventElement.closest('.note').id, eventElement.closest('.note').querySelector('.note__labelName').textContent)
            }

            //Удаление заметки
             else if (eventElement.matches('.note__buttonDelete')) {
                 let deleteNoteId = eventElement.closest('.note').id;
                 document.getElementById(deleteNoteId).remove();

                this.notes = this.notes.filter(note => note.id != deleteNoteId);

                setTimeout(() => {
                    this.reindex();
                    this.applyFilter();
                    requestAnimationFrame(() => {
                        this.checkListIsEmpty();
                        this.renderSeparators();
                    });
                }, 0);
            }

             //Смена класса выполненности
             else {
                let noteId = eventElement.closest('.note').id;
                let noteIsDone = eventElement.closest('.note__noteItem').classList.contains('note__noteItem_isChecked')

                const response = fetch(`${this.apiUrl}/${noteId}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json;charset=utf-8'
                    },
                    body: JSON.stringify({
                        completed: !noteIsDone
                    })
                });

                e.target.closest('.note__noteItem').classList.toggle('note__noteItem_isChecked');
            }
        })


        // Открытие модального + обработка модального
        document.querySelector('.mainBody__addNote').addEventListener('click', () => this.openModal());
        document.querySelector('.modalButtons__cancel').addEventListener('click', () => this.closeModal());
        document.querySelector('.modalButtons__apply').addEventListener('click', () => this.modalApply())
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

    reindex() {
        this.notes.forEach((note, index) => {
            let oldId = note.id;
            let newId = index + 1;

            if (oldId != newId) {
                document.getElementById(oldId).id = newId
                note.id = newId;

                const response = fetch(`${this.apiUrl}/${newId}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json;charset=utf-8'
                    },
                    body: JSON.stringify({
                        id: newId
                    })
                });
            }
        });
    }

    openFilter() {
        document.querySelector('.taskFilter__trigger').setAttribute('aria-expanded', 'true')
    }

    closeFilter() {
        document.querySelector('.taskFilter__trigger').setAttribute('aria-expanded', 'false')
    }

    openModal(isEditing = false, id, noteForEdit) {
        this.modal.classList.remove('addNoteModal_hidden');
        this.titleInput = document.querySelector('.modalContent__inputNote');

        document.querySelector('.modalContent__title').textContent = isEditing ? 'EDIT NOTE' : 'NEW NOTE';


        // Редактирование
        if (isEditing) {
            this.titleInput.oninput = null

            this.isEditing = true;
            this.EditingNoteId = id;
            this.titleInput.value = noteForEdit;
        }

        // Добавление
        else {

            this.isEditing = false;
            this.EditingNoteId = null;
            this.titleInput.value = localStorage.getItem('inputNote') || '';

            // Сохранение ввода
            this.titleInput.oninput = () => {
                localStorage.setItem('inputNote', this.titleInput.value);
            };
        }
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
        if (this.isEditing && this.EditingNoteId) {
            document.getElementById(this.EditingNoteId).querySelector('.note__labelName').textContent = this.titleInput.value;

            const response = fetch(`${this.apiUrl}/${this.EditingNoteId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json;charset=utf-8'
                },
                body: JSON.stringify({
                    title: this.titleInput.value
                })
            });
        }

        // Добавление
        else {
            const newNote = this.createNote(this.titleInput.value, this.notes.length + 1, false, true);
            this.container.appendChild(newNote);

            this.notes.push({
                userId: 1,
                id: this.notes.length + 1,
                title: this.titleInput.value,
                completed: false
            });

            localStorage.removeItem('inputNote');

            const response = fetch(`${this.apiUrl}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json;charset=utf-8'
                },
                body: JSON.stringify({
                    userId: 1,
                    id: this.notes.length + 1,
                    title: this.titleInput.value,
                    completed: false

                })
            });
            requestAnimationFrame(() => {
                this.renderSeparators();
                this.checkListIsEmpty();
            });
        }

        this.titleInput.value = '';
        this.closeModal();
    }

    closeModal() {
        this.modal.classList.add('addNoteModal_hidden');
    }

    isLoading(load = true) {
        document.querySelector('.loadingDots').classList.toggle('loadingDots_hidden', !load);
    }

};

new MainNoteList();