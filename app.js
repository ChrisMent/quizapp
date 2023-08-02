// Anfrage an den Server, um die Quizdaten abzurufen
fetch("/quizapp/data.json")
    .then(response => response.json())
    .then(data => {
        // Initialisierung von Variablen
        let currentQuestion = 0;
        let correctAnswers = 0;
        let wrongAnswers = 0;
        let nextBtn = document.getElementById('next-button');
        let audioCorrect = new Audio('sounds/correct.wav');
        let audioWrong = new Audio('sounds/wrong.mp3');
        let cardClickHandlers = [];

        // Aktualisiert die Gesamtzahl der Fragen
        function updateQuestionCount() {
            document.getElementById('question-count').innerText = data.questions.length;
        }

        // Aktualisiert die Nummer der aktuellen Frage
        function updateQuestionPosition() {
            document.getElementById('current-question-count').innerText = currentQuestion + 1;
        }

        // Aktualisiert den Fortschrittsbalken
        function updateQuestionProgress() {
            let progressQuiz = Math.round(currentQuestion / data.questions.length * 100);
            let questionProgressBar = document.getElementById('progress-bar-container');
            if (currentQuestion === 0) {
                questionProgressBar.innerHTML = '0 %';
                questionProgressBar.style.width = "0%";
            } else {
                questionProgressBar.style.width = progressQuiz + "%";
                questionProgressBar.innerHTML = progressQuiz + ' %';
            }
        }

        // Diese Funktion ist dafür verantwortlich, die aktuelle Frage und die zugehörigen Antwortoptionen anzuzeigen
        function showQuestion() {
            // Holt die aktuelle Frage aus dem Datensatz anhand des aktuellen Frageindex
            let question = data.questions[currentQuestion];

            // Setzt den Text der aktuellen Frage im HTML-Element mit der ID 'question-text'
            document.getElementById('question-text').innerHTML = question.question;

            // Durchläuft alle Antwortoptionen der aktuellen Frage
            question.options.forEach((option, index) => {
                // Setzt den Text jeder Antwortoption im entsprechenden HTML-Element
                // Die ID des Elements wird dynamisch generiert, basierend auf dem Index der Option (z.B. 'answer-text-1', 'answer-text-2', usw.)
                document.getElementById(`answer-text-${index + 1}`).innerHTML = option;
            });
        }


        // Gibt die richtige Antwort auf die aktuelle Frage zurück
        function rightAnswer() {
            return data.questions[currentQuestion].answer;
        }

        // Fügt Event Listener zu den Antwortkarten hinzu
        function addCardListeners() {
            // Wählt alle Karten-Elemente mit der Klasse 'border-special-1' aus
            let cardElems = document.querySelectorAll('.card.border-special-1');
            // Durchläuft jedes Karten-Element
            cardElems.forEach(cardElem => {
                // Klont das aktuelle Karten-Element, einschließlich aller untergeordneten Knoten
                let newCardElem = cardElem.cloneNode(true);
                // Ersetzt das ursprüngliche Karten-Element durch das geklonte Element im DOM
                cardElem.parentNode.replaceChild(newCardElem, cardElem);
                // Definiert einen Handler für das Klick-Ereignis, der die Funktion 'handleCardClick' mit dem geklonten Element aufruft
                let handler = () => handleCardClick(newCardElem);
                // Fügt den Klick-Handler dem geklonten Karten-Element hinzu
                newCardElem.addEventListener('click', handler);
                // Speichert das geklonte Karten-Element und den Handler in der 'cardClickHandlers' Liste
                // Dies ermöglicht es, den Handler später zu entfernen, wenn die Interaktivität deaktiviert wird
                cardClickHandlers.push({ element: newCardElem, handler: handler });
            });
        }
        

        // Behandelt das Klicken auf eine Antwortkarte
        function handleCardClick(cardElem) {
            // Überprüft, ob die Karte die Klasse 'not-interactive' hat, die darauf hinweist,
            // dass die Karte nicht anklickbar sein sollte (z.B. nachdem eine Antwort ausgewählt wurde)
            if (cardElem.querySelector('.card-body').classList.contains('not-interactive')) {
                return; // Wenn die Karte nicht interaktiv ist, wird die Funktion frühzeitig beendet
            }

            // Überprüft, ob die aktuelle Frage innerhalb der Länge der Fragenliste liegt
            if (currentQuestion < data.questions.length) {
                // Wählt das Element mit der Klasse 'card-body.onhover' innerhalb der Karte aus,
                // um den Text der ausgewählten Antwort zu erhalten
                let cardBodyOnHover = cardElem.querySelector('.card-body.onhover');
                // Holt den Text der ausgewählten Antwort, falls vorhanden
                let answerText = cardBodyOnHover ? cardBodyOnHover.innerText : "";
                // Ruft die richtige Antwort für die aktuelle Frage ab
                let correctAnswer = rightAnswer();
                // Findet das übergeordnete Zeilenelement der Karte
                let rowElem = cardElem.closest('.row');
                // Findet das Kontrollkästchen innerhalb der Zeile, das zur Anzeige der Antwortmarkierung verwendet wird
                let checkboxElem = rowElem.querySelector('.checkbox');
                // Ruft die Funktion auf, die die ausgewählte Antwort mit der richtigen Antwort vergleicht
                // und die Benutzeroberfläche entsprechend aktualisiert
                handleAnswerSelection(answerText, correctAnswer, checkboxElem);
            }
        }

        // Behandelt die Auswahl einer Antwort
        function handleAnswerSelection(answerText, correctAnswer, checkboxElem) {
            // Entfernt vorherige Markierungen
            let allCheckboxElems = document.querySelectorAll('.checkbox');
            allCheckboxElems.forEach(elem => {
                elem.classList.remove('correct-answer');
                elem.classList.remove('wrong-answer');
            });

            // Überprüft die Antwort und spielt den entsprechenden Ton ab
            if (answerText === correctAnswer) {
                checkboxElem.classList.add('correct-answer');
                correctAnswers++;
                playAudio(audioCorrect);
            } else {
                checkboxElem.classList.add('wrong-answer');
                wrongAnswers++;
                playAudio(audioWrong);
                markCorrectAnswer(correctAnswer);
            }

            // Deaktiviert die Interaktivität der Karten
            disableInteractivity();
            nextBtn.disabled = false;
        }

        // Spielt einen Audioton ab
        function playAudio(audio) {
            audio.currentTime = 0;
            audio.play();
        }

        // Diese Funktion markiert die korrekte Antwort in der Benutzeroberfläche
        function markCorrectAnswer(correctAnswer) {
            // Alle Zeilen (Fragenoptionen) im Quiz werden ausgewählt
            let allRows = document.querySelectorAll('.row');
            let correctCheckbox; // Variable zum Speichern des Kontrollkästchens der korrekten Antwort

            // Durchläuft alle Zeilen, um die korrekte Antwort zu finden
            for (let i = 0; i < allRows.length; i++) {
                // Wählt das Element mit der Klasse 'card-body.onhover' innerhalb der aktuellen Zeile aus
                let optionElement = allRows[i].querySelector('.card-body.onhover');
                // Holt den Text aus dem ausgewählten Element (die Antwortoption)
                let option = optionElement ? optionElement.innerText : null;

                // Überprüft, ob die aktuelle Option die korrekte Antwort ist
                if (option === correctAnswer) {
                    // Wenn ja, wird das Kontrollkästchen innerhalb der aktuellen Zeile ausgewählt
                    correctCheckbox = allRows[i].querySelector('.checkbox');
                    break; // Schleife wird beendet, da die korrekte Antwort gefunden wurde
                }
            }

            // Wenn das Kontrollkästchen der korrekten Antwort gefunden wurde
            if (correctCheckbox) {
                // Fügt die Klasse 'correct-answer' zum Kontrollkästchen hinzu, um es visuell als korrekt zu markieren
                correctCheckbox.classList.add('correct-answer');
            }
        }


            // Deaktiviert die Interaktivität der Karten
            function disableInteractivity() {
                // Durchläuft die Liste der gespeicherten Klick-Handler für jede Karte
                cardClickHandlers.forEach(item => {
                    // Entfernt den Klick-Handler von jedem Kartenelement
                    // Dadurch wird verhindert, dass die Karte auf weitere Klicks reagiert
                    item.element.removeEventListener('click', item.handler);
                });
                // Leert die Liste der Handler, da sie nicht mehr benötigt werden
                cardClickHandlers = [];

                // Wählt alle Elemente mit der Klasse 'card-body' aus
                let cardBodyElems = document.querySelectorAll('.card-body');
                // Fügt die Klasse 'not-interactive' zu jedem 'card-body'-Element hinzu
                // Diese Klasse kann verwendet werden, um das Aussehen der Karte zu ändern, wenn sie nicht interaktiv ist
                // oder um in anderen Funktionen zu überprüfen, ob die Karte interaktiv sein sollte
                cardBodyElems.forEach(cardBody => {
                    cardBody.classList.add('not-interactive');
                });
            }


        // Geht zur nächsten Frage oder beendet das Quiz
        function nextQuestionOrFinish()
        {
            if (currentQuestion < data.questions.length - 1) {
                currentQuestion++;
                updateQuizState(); // Aktualisiert den Zustand des Quiz
            } else {
                finishQuiz(); // Beendet das Quiz
            }
        }

        // Aktualisiert den Zustand des Quiz (Fragen, Fortschritt usw.)
        function updateQuizState() {
            showQuestion();
            updateQuestionPosition();
            addCardListeners();
            updateQuestionProgress();
            nextBtn.innerHTML = currentQuestion >= data.questions.length - 1 ? 'Abschließen' : 'Nächste Frage';
        }

        // Beendet das Quiz und zeigt das Ergebnis an
        function finishQuiz() {
            disableInteractivity(); // Deaktiviert die Interaktivität der Karten sofort
        
            let questionProgressBar = document.getElementById('progress-bar-container');
            questionProgressBar.style.width = "100%";
            questionProgressBar.innerHTML = '100 %';
        
            setTimeout(() => {
                displayResults(); // Zeigt die Ergebnisse an
                nextBtn.disabled = false; // Aktiviert den "Neustart"-Button
            }, 2200);
        }
        

        // Zeigt die Ergebnisse des Quiz an
        function displayResults() {
            // Versteckt und zeigt verschiedene Elemente, um die Ergebnisse anzuzeigen
            let leftFooter = document.getElementById('question-numbering');
            let imageFinish = document.getElementById('finish-img');
            let questionBlock = document.getElementById('question-block');
            let quizResult = document.getElementById('quiz-result');
            let questionText = document.getElementById('question-text');

            nextBtn.innerHTML = 'Neustart';
            leftFooter.classList.add('d-none');
            questionText.classList.add('d-none');
            questionBlock.classList.add('d-none');
            imageFinish.classList.remove('d-none');
            quizResult.classList.remove('d-none');

            quizResultsPercent(); // Zeigt die Prozentwerte der Ergebnisse an
            document.getElementById('wrong-answer').innerHTML = wrongAnswers;
            document.getElementById('correct-answers').innerHTML = correctAnswers;
        }

        // Berechnet und zeigt die Prozentwerte der Ergebnisse an
        function quizResultsPercent() {
            let amountOfQuestions = data.questions.length;
            let rightAnswersPercentText = document.getElementById('right-answers-percent');
            let wrongAnswersPercentText = document.getElementById('wrong-answers-percent');
            let displayPercentCorrect = (correctAnswers / amountOfQuestions) * 100;
            let displayPercentWrong = (wrongAnswers / amountOfQuestions) * 100;

            rightAnswersPercentText.innerHTML = `${displayPercentCorrect.toFixed(2)} %`;
            wrongAnswersPercentText.innerHTML = `${displayPercentWrong.toFixed(2)} %`;
        }

        // Startet das Quiz neu
        function restartQuiz() {
            // Setzt alle Variablen und Elemente auf ihre Anfangswerte zurück
            currentQuestion = 0;
            correctAnswers = 0;
            wrongAnswers = 0;

            // Entfernt vorherige Markierungen
            let allCheckboxElems = document.querySelectorAll('.checkbox');
            allCheckboxElems.forEach(elem => {
                elem.classList.remove('correct-answer');
                elem.classList.remove('wrong-answer');
            });

            // Entfernt die Nicht-Interaktivität der Karten
            let cardBodyElems = document.querySelectorAll('.card-body');
            cardBodyElems.forEach(cardBody => {
                cardBody.classList.remove('not-interactive');
            });

            // Setzt die Anzeigeelemente zurück
            let leftFooter = document.getElementById('question-numbering');
            let imageFinish = document.getElementById('finish-img');
            let questionBlock = document.getElementById('question-block');
            let quizResult = document.getElementById('quiz-result');
            let questionText = document.getElementById('question-text');
            let questionProgressBar = document.getElementById('progress-bar-container');

            leftFooter.classList.remove('d-none');
            questionText.classList.remove('d-none');
            questionBlock.classList.remove('d-none');
            imageFinish.classList.add('d-none');
            quizResult.classList.add('d-none');

            nextBtn.innerHTML = 'Next';
            questionProgressBar.innerHTML = '0%';
            questionProgressBar.style.width = "0%";

            showQuestion();
            updateQuestionPosition();
            addCardListeners();
            nextBtn.disabled = true;
            
        }

        // Initialisiert das Quiz
        updateQuestionCount();
        showQuestion();
        updateQuestionPosition();
        addCardListeners();
        quizResultsPercent();
        updateQuestionProgress();

        // Fügt einen Event Listener zum "Nächste Frage" oder "Neustart" Button hinzu
        nextBtn.addEventListener('click', () => {
            if (nextBtn.innerHTML === 'Neustart') {
                restartQuiz(); // Startet das Quiz neu
            } else {
                nextQuestionOrFinish(); // Geht zur nächsten Frage oder beendet das Quiz

                // Entfernt vorherige Markierungen
                let allCheckboxElems = document.querySelectorAll('.checkbox');
                allCheckboxElems.forEach(elem => {
                    elem.classList.remove('correct-answer');
                    elem.classList.remove('wrong-answer');
                });

                // Entfernt die Nicht-Interaktivität der Karten
                let cardBodyElems = document.querySelectorAll('.card-body');
                cardBodyElems.forEach(cardBody => {
                    cardBody.classList.remove('not-interactive');
                });

                nextBtn.disabled = true;
            }
        });
    })
    .catch(error => console.error('Error:', error)); // Fehlerbehandlung

