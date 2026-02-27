class mainNoteList {
     constructor() {
         this.notes = [];
         this.apiUrl = 'https://jsonplaceholder.typicode.com/todos';
         this.container = document.querySelector('.noteList');
         this.loadNotes();

         this.modal = document.querySelector('.addNoteModal');
     }

    async loadNotes() {
         // Загрузка заметок с АПИ
        this.notes = await fetch(`${this.apiUrl}/?_limit=5&_page=1`).then(response => response.json());

        // Я знаю что тут нужно объединить с createNote, но пока немного затуп :(
        this.container.innerHTML = this.notes.map((note, index) => `
            ${note.id == 1 ? '' : '<div class="noteList__separator"></div>'}
            <div class="note" id="${note.id}">
                <label class="note__noteItem ${note.completed ? 'note__noteItem_isChecked' : ''}">
                    <span class="note__noteCheckbox"></span>
                    <span class="note__labelName"> ${note.title} </span>
                </label>
            </div>
            `).join('');


        this.attachEventListeners();
    }


    createNote(note, index, completed) {

        const noteDiv = document.createElement('div');
        noteDiv.className = 'note';
        noteDiv.id = `${index}`;
        noteDiv.innerHTML += `
                <div class="note" id="${note.id}">
                ${note.id == 1 ? '' : '<div class="noteList__separator"></div>'}
                <label class="note__noteItem ${note.completed ? 'note__noteItem_isChecked' : ''}">
                    <span class="note__noteCheckbox"></span>
                    <span class="note__labelName"> ${note} </span>
                </label>
                </div>
        `;


        document.querySelector('.noteList').insertBefore(noteDiv, this.noteList);
    }

    // Прикрепление обработок
    attachEventListeners() {
        // Переключение заметки на выолнение и обратно
        document.querySelector('.noteList').addEventListener('click', (e) => {
            let noteId = e.target.closest('.note').id;
            let noteIsDone = e.target.closest('.note__noteItem').classList.contains('note__noteItem_isChecked')

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
        })

        document.querySelector('.selectWrapper__select').addEventListener('click', () => {
        })


        // Открытие модального + обработка модального
        document.querySelector('.mainBody__addNote').addEventListener('click', () => this.openModal());
        document.querySelector('.modalButtons__cancel').addEventListener('click', () => this.closeModal());
        document.querySelector('.modalButtons__apply').addEventListener('click', () => {
            this.createNote(this.titleInput.value, this.notes.length + 1, false);
            localStorage.removeItem('inputNote');
            this.titleInput.value='';
            this.closeModal();
        });
    }

    openModal() {
        this.modal.classList.remove('addNoteModal_hidden');


        // Сохранение значения для поля ввода
        this.titleInput = document.querySelector('.modalContent__inputNote');
        this.titleInput.value = localStorage.getItem('inputNote');
        this.titleInput.oninput = () => {
            localStorage.setItem('inputNote', this.titleInput.value)
        };
    }

    closeModal() {
        this.modal.classList.add('addNoteModal_hidden');
    }



};

new mainNoteList;