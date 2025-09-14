function replaceOps(expr) {

    while (expr.includes('→')) {
        expr = expr.replace(
            /(\([^()]+\)|[A-Z])\s*→\s*(\([^()]+\)|[A-Z])/g,
            '((!$1) || $2)'
        );
    }

    while (expr.includes('↔')) {
        expr = expr.replace(
            /(\([^()]+\)|[A-Z])\s*↔\s*(\([^()]+\)|[A-Z])/g,
            '($1 === $2)'
        );
    }


    expr = expr.replace(/¬/g, '!');
    expr = expr.replace(/∧/g, '&&');
    expr = expr.replace(/∨/g, '||');
    expr = expr.replace(/⊕/g, '!=='); 

    return expr;
}

function evalExpr(expr, values) {

    let processedExpr = expr;
    for (const [varName, value] of Object.entries(values)) {
        const regex = new RegExp(`\\b${varName}\\b`, 'g');
        processedExpr = processedExpr.replace(regex, value ? 'true' : 'false');
    }

    try {

        const result = new Function(`return ${processedExpr}`)();
        return result ? 1 : 0;
    } catch (error) {
        console.error('Ошибка вычисления:', processedExpr, error);
        throw error;
    }
}

function extractSubexpressions(expr) {
    const subexprs = new Set();
    const stack = [];

    for (let i = 0; i < expr.length; i++) {
        if (expr[i] === '(') {
            stack.push(i);
        } else if (expr[i] === ')') {
            if (stack.length === 0) continue;
            const start = stack.pop();
            const subexpr = expr.substring(start, i + 1);
            if (subexpr.length > 2) { 
                subexprs.add(subexpr);
            }
        }
    }

    const operationPattern = /[∧∨→↔⊕¬]/;
    if (operationPattern.test(expr)) {
        subexprs.add(expr);
    }

    const parts = expr.split(/([∧∨→↔⊕¬()])/).filter(p => p.trim());
    for (let i = 0; i < parts.length; i++) {
        if (operationPattern.test(parts[i]) && i > 0 && i < parts.length - 1) {
            const sub = parts[i-1] + parts[i] + parts[i+1];
            if (sub.length >= 3) {
                subexprs.add(sub);
            }
        }
    }

    return Array.from(subexprs).filter(sub => {
        return !/^[A-Z]$/.test(sub) && sub.trim().length > 1;
    }).sort((a, b) => a.length - b.length);
}

function calculate() {
    const rawExpr = document.getElementById('expression').value.trim();
    const errorDiv = document.getElementById('error');
    const resultDiv = document.getElementById('result');

    errorDiv.textContent = '';
    resultDiv.innerHTML = '';

    if (!rawExpr) {
        errorDiv.textContent = 'Пожалуйста, введите выражение';
        return;
    }

    try {
        const variables = Array.from(new Set(rawExpr.match(/[A-Z]/g) || []))
            .filter(v => v)
            .sort();

        if (variables.length === 0) {
            errorDiv.textContent = 'Не найдено переменных (используйте A-Z)';
            return;
        }

        const subexprs = extractSubexpressions(rawExpr);
        
        if (!subexprs.includes(rawExpr) && rawExpr.length > 1) {
            subexprs.push(rawExpr);
        }

        let tableHTML = `
            <h3>Выражение: ${rawExpr}</h3>
            <p>Переменные: ${variables.join(', ')}</p>
            <div style="overflow-x: auto;">
            <table>
                <thead>
                    <tr>
                        ${variables.map(v => `<th>${v}</th>`).join('')}
                        ${subexprs.map(sub => `<th>${sub}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
        `;

        const combinations = generateCombinations(variables.length);

        for (const combination of combinations) {
            const valDict = {};
            variables.forEach((v, i) => {
                valDict[v] = combination[i];
            });

            const row = [...combination.map(v => v ? '1' : '0')];

            for (const sub of subexprs) {
                try {
                    const jsExpr = replaceOps(sub);
                    const res = evalExpr(jsExpr, valDict);
                    row.push(res.toString());
                } catch (e) {
                    row.push('E');
                }
            }

            tableHTML += `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`;
        }

        tableHTML += `
                </tbody>
            </table>
            </div>
        `;

        resultDiv.innerHTML = tableHTML;

    } catch (error) {
        errorDiv.textContent = `Ошибка: ${error.message}`;
    }
}

function generateCombinations(length) {
    const result = [];
    const total = Math.pow(2, length);

    for (let i = 0; i < total; i++) {
        const combination = [];
        for (let j = 0; j < length; j++) {
            combination.push(!!(i & (1 << (length - 1 - j))));
        }
        result.push(combination);
    }

    return result;
}


document.getElementById('expression').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        calculate();
    }
});
