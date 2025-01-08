/**
 * Inicializa a validação e o tratamento de envio de formulário quando o conteúdo
 * do DOM estiver completamente carregado.
 */
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('form:not(.form-ignore)').forEach(form => {
    form.addEventListener('submit', event => {
      event.preventDefault();

      const formElement = event.target.closest('form');
      const action = formElement.getAttribute('action');
      const method = formElement.getAttribute('method');
      const data = new FormData(formElement);
      const submitButton = formElement.querySelector('button[type=submit]');
      const originalButtonText = submitButton.innerText;

      setFormInputsReadOnly(formElement, true);
      setSubmitButtonLoading(submitButton);

      fetch(action, {
        method: method,
        headers: getHeaders(formElement),
        body: data,
      })
        .then(handleResponse)
        .catch(handleError)
        .finally(() => {
          setFormInputsReadOnly(formElement, false);
          resetSubmitButton(submitButton, originalButtonText);
        });

      /**
       * Trata a resposta do servidor.
       * @param {Response} response - O objeto de resposta da solicitação fetch.
       * @throws Lançará um erro se o status da resposta for diferente de 200.
       */
      function handleResponse(response) {
        if (response.status !== 200) {
          throw response;
        }
        return response.json().then(data => {
          if (data.redirect) {
            window.location.href = data.redirect;
          } else {
            showAlert(formElement, 'success', data.message);
          }
        });
      }

      /**
       * Trata erros da solicitação fetch.
       * @param {Error} error - O objeto de erro da solicitação fetch.
       */
      function handleError(error) {
        if (error.json && error.status > 400 && error.status < 500) {
          if (error.status === 422) {
            error.json().then(data => {
              if (!data.errors) return;
              highlightValidInputs(formElement);
              Object.entries(data.errors).forEach(([key, messages]) => {
                const input = formElement.querySelector(`input[name=${key}]`);
                validateInput(input, messages);
              });
            });
            return;
          }
          showAlert(formElement, 'warning', error.message);
        } else {
          showAlert(formElement, 'danger', `${error.status} - ${error.statusText}`);
        }
      }

      /**
       * Valida o input e exibe feedback de erro.
       * @param {HTMLElement} input - O elemento de input a validar.
       * @param {Array} invalidFeedback - A lista de mensagens de feedback a exibir.
       */
      function validateInput(input, invalidFeedback) {
        const feedbackElement = getOrCreateFeedbackElement(input);
        input.classList.add('is-invalid');
        input.classList.remove('is-valid');
        feedbackElement.innerHTML = `<ul><li>${invalidFeedback.join('</li><li>')}</li></ul>`;
        input.addEventListener('input', () => {
          input.classList.remove('is-invalid');
          feedbackElement.innerHTML = '';
        });
      }

      /**
       * Obtem os cabeçalhos para a solicitação fetch.
       * @param {HTMLElement} form - O elemento de formulário a obter os cabeçalhos.
       * @returns {Object} - O objeto de cabeçalhos para a solicitação fetch.
       */
      function getHeaders(form) {
        return {
          'X-CSRF-TOKEN': form.querySelector('input[name=_token]').value,
          'X-Requested-With': 'XMLHttpRequest',
          'Accept': 'application/json',
        };
      }

      /**
       * Define o estado de apenas leitura para todos os inputs do formulário.
       * @param {HTMLElement} form - O elemento de formulário contendo inputs.
       * @param {boolean} isReadOnly - O estado de apenas leitura a ser definido.
       */
      function setFormInputsReadOnly(form, isReadOnly) {
        form.querySelectorAll('input').forEach(input => {
          input.readOnly = isReadOnly;
        });
      }

      /**
       * Define o botão de envio para um estado de carregamento.
       * @param {HTMLElement} button - O botão de envio.
       */
      function setSubmitButtonLoading(button) {
        button.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Enviando...';
      }

      /**
       * Restaura o botão de envio para seu estado original.
       * @param {HTMLElement} button - O botão de envio.
       * @param {string} originalText - O texto original do botão.
       */
      function resetSubmitButton(button, originalText) {
        button.textContent = originalText;
      }

      /**
       * Exibe uma mensagem de alerta dentro do formulário.
       * @param {HTMLElement} form - O elemento de formulário a exibir o alerta.
       * @param {string} type - O tipo de alerta ('success', 'warning', 'danger').
       * @param {string} message - A mensagem a exibir no alerta.
       */
      function showAlert(form, type, message) {
        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        alert.role = 'alert';
        alert.textContent = message;
        form.prepend(alert);
      }

      /**
       * Destaca os inputs válidos no formulário.
       * @param {HTMLElement} form - O elemento de formulário contendo inputs.
       */
      function highlightValidInputs(form) {
        form.querySelectorAll('input[type=text]').forEach(input => {
          input.classList.add('is-valid');
        });
      }

      /**
       * Obtem ou cria um elemento de feedback para o input.
       * @param {HTMLElement} input - O elemento de input a obter o feedback.
       * @returns {HTMLElement} - O elemento de feedback.
       */
      function getOrCreateFeedbackElement(input) {
        const parent = input.parentElement;
        let feedback = parent.querySelector('.invalid-feedback');
        if (!feedback) {
          feedback = document.createElement('div');
          feedback.classList.add('invalid-feedback');
          parent.appendChild(feedback);
        }
        return feedback;
      }
    });
  });
});
