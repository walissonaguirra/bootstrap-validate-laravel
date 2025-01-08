"use strict";

function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
/**
 * Inicializa a validação e o tratamento de envio de formulário quando o conteúdo 
 * do DOM estiver completamente carregado.
 */
document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('form:not(.form-ignore)').forEach(function (form) {
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var formElement = event.target.closest('form');
      var action = formElement.getAttribute('action');
      var method = formElement.getAttribute('method');
      var data = new FormData(formElement);
      var submitButton = formElement.querySelector('button[type=submit]');
      var originalButtonText = submitButton.innerText;
      setFormInputsReadOnly(formElement, true);
      setSubmitButtonLoading(submitButton);
      fetch(action, {
        method: method,
        headers: getHeaders(formElement),
        body: data
      }).then(handleResponse)["catch"](handleError)["finally"](function () {
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
        return response.json().then(function (data) {
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
            error.json().then(function (data) {
              if (!data.errors) return;
              highlightValidInputs(formElement);
              Object.entries(data.errors).forEach(function (_ref) {
                var _ref2 = _slicedToArray(_ref, 2),
                  key = _ref2[0],
                  messages = _ref2[1];
                var input = formElement.querySelector("input[name=".concat(key, "]"));
                validateInput(input, messages);
              });
            });
            return;
          }
          showAlert(formElement, 'warning', error.message);
        } else {
          showAlert(formElement, 'danger', "".concat(error.status, " - ").concat(error.statusText));
        }
      }

      /**
       * Valida o input e exibe feedback de erro.
       * @param {HTMLElement} input - O elemento de input a validar.
       * @param {Array} invalidFeedback - A lista de mensagens de feedback a exibir.
       */
      function validateInput(input, invalidFeedback) {
        var feedbackElement = getOrCreateFeedbackElement(input);
        input.classList.add('is-invalid');
        input.classList.remove('is-valid');
        feedbackElement.innerHTML = "<ul><li>".concat(invalidFeedback.join('</li><li>'), "</li></ul>");
        input.addEventListener('input', function () {
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
          'Accept': 'application/json'
        };
      }

      /**
       * Define o estado de apenas leitura para todos os inputs do formulário.
       * @param {HTMLElement} form - O elemento de formulário contendo inputs.
       * @param {boolean} isReadOnly - O estado de apenas leitura a ser definido.
       */
      function setFormInputsReadOnly(form, isReadOnly) {
        form.querySelectorAll('input').forEach(function (input) {
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
        var alert = document.createElement('div');
        alert.className = "alert alert-".concat(type);
        alert.role = 'alert';
        alert.textContent = message;
        form.prepend(alert);
      }

      /**
       * Destaca os inputs válidos no formulário.
       * @param {HTMLElement} form - O elemento de formulário contendo inputs.
       */
      function highlightValidInputs(form) {
        form.querySelectorAll('input[type=text]').forEach(function (input) {
          input.classList.add('is-valid');
        });
      }

      /**
       * Obtem ou cria um elemento de feedback para o input.
       * @param {HTMLElement} input - O elemento de input a obter o feedback.
       * @returns {HTMLElement} - O elemento de feedback.
       */
      function getOrCreateFeedbackElement(input) {
        var parent = input.parentElement;
        var feedback = parent.querySelector('.invalid-feedback');
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
//# sourceMappingURL=bootstrap-validate-laravel.js.map