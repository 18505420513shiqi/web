(function () {
  const display = document.getElementById("display");
  const keys = document.querySelector(".keys");

  let current = "0";
  let previous = null;
  let operator = null;
  let shouldReset = false;

  function updateDisplay() {
    display.textContent = current;
  }

  function inputDigit(digit) {
    if (shouldReset) {
      current = digit;
      shouldReset = false;
    } else if (current === "0") {
      current = digit;
    } else if (current === "-0") {
      current = "-" + digit;
    } else {
      current += digit;
    }
    updateDisplay();
  }

  function inputDecimal() {
    if (shouldReset) {
      current = "0.";
      shouldReset = false;
      updateDisplay();
      return;
    }
    if (!current.includes(".")) {
      current += ".";
      updateDisplay();
    }
  }

  function clearAll() {
    current = "0";
    previous = null;
    operator = null;
    shouldReset = false;
    updateDisplay();
  }

  function toggleSign() {
    if (current === "0") return;
    current = current.startsWith("-") ? current.slice(1) : "-" + current;
    updateDisplay();
  }

  function percent() {
    const value = parseFloat(current);
    if (Number.isNaN(value)) return;
    current = formatResult(value / 100);
    updateDisplay();
  }

  function calculate(a, b, op) {
    switch (op) {
      case "+":
        return a + b;
      case "-":
        return a - b;
      case "*":
        return a * b;
      case "/":
        return b === 0 ? NaN : a / b;
      default:
        return b;
    }
  }

  function formatResult(value) {
    if (!Number.isFinite(value)) return "Error";
    const rounded = Math.round(value * 1e10) / 1e10;
    let text = String(rounded);
    if (text.length > 12) {
      text = rounded.toPrecision(10).replace(/\.?0+$/, "");
    }
    return text;
  }

  function setOperator(nextOp) {
    const value = parseFloat(current);

    if (previous !== null && operator && !shouldReset) {
      const result = calculate(previous, value, operator);
      current = formatResult(result);
      previous = current === "Error" ? null : parseFloat(current);
      updateDisplay();
    } else {
      previous = value;
    }

    operator = nextOp;
    shouldReset = true;
  }

  function equals() {
    if (operator === null || previous === null) return;

    const value = parseFloat(current);
    const result = calculate(previous, value, operator);
    current = formatResult(result);
    previous = null;
    operator = null;
    shouldReset = true;
    updateDisplay();
  }

  keys.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    const action = button.dataset.action;

    switch (action) {
      case "digit":
        inputDigit(button.dataset.value);
        break;
      case "decimal":
        inputDecimal();
        break;
      case "clear":
        clearAll();
        break;
      case "sign":
        toggleSign();
        break;
      case "percent":
        percent();
        break;
      case "operator":
        setOperator(button.dataset.value);
        break;
      case "equals":
        equals();
        break;
    }
  });

  document.addEventListener("keydown", (event) => {
    const { key } = event;

    if (/^[0-9]$/.test(key)) {
      inputDigit(key);
      return;
    }

    if (key === ".") {
      inputDecimal();
      return;
    }

    if (key === "Escape" || key === "c" || key === "C") {
      clearAll();
      return;
    }

    if (key === "Enter" || key === "=") {
      event.preventDefault();
      equals();
      return;
    }

    if (key === "%") {
      percent();
      return;
    }

    if (["+", "-", "*", "/"].includes(key)) {
      setOperator(key);
    }
  });

  updateDisplay();
})();
