class MainNoteList {
     constructor() {
         this.notes = [];
         this.apiUrl = 'https://jsonplaceholder.typicode.com/todos';
         this.container = document.querySelector('.noteList');
         this.loadNotes();

         this.modal = document.querySelector('.addNoteModal');
         this.isEditing = false;
         this.EditingNoteId = null;
         this.titleInput = null;
     }

    async loadNotes() {
        this.notes = await fetch(`${this.apiUrl}/?_limit=5&_page=1`).then(r => r.json());

        this.container.innerHTML = this.notes
            .map((note) => this.createNote(note.title, note.id, note.completed))
            .join('');

        this.attachEventListeners();
    }


    createNote(title, index, completed, asDOM = false) {
        const html = `
            <li class="note" id="${index}">
                ${index == 1 ? '' : '<div class="noteList__separator"></div>'}
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

    // Прикрепление обработок
    attachEventListeners() {
        this.container.addEventListener('click', (e) => {

            let eventElement = e.target;

            //Редактирование заметки
            if (eventElement.matches('.note__buttonEdit')) {
                this.openModal(true, eventElement.closest('.note').id, eventElement.closest('.note').querySelector('.note__labelName').textContent)
            }

            //Удаление заметки
             else if (eventElement.matches('.note__buttonDelete')) {
                 let deleteNoteId = eventElement.closest('.note').id;
                 let deleteNote = document.getElementById(deleteNoteId);
                 deleteNote.remove();

                this.notes = this.notes.filter(note => note.id != deleteNoteId);

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

                        if (newId == 1) {
                            document.getElementById('1').querySelector('.noteList__separator').remove();
                        }
                    }
                });
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
        }

        this.titleInput.value = '';
        this.closeModal();
    }

    closeModal() {
        this.modal.classList.add('addNoteModal_hidden');
    }

};

new MainNoteList();