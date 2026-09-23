/**
 * Plantilla inicial y lenguaje de Monaco por cada programming_language.code.
 * El programa del candidato lee la entrada por stdin e imprime la respuesta por stdout;
 * el backend compara esa salida con la salida esperada de cada caso de prueba.
 */
const TEMPLATES: Record<string, { monaco: string; template: string }> = {
  java: {
    monaco: 'java',
    template: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        // Lee la entrada, por ejemplo: int a = scanner.nextInt();

        // Imprime la respuesta
        System.out.println("");
    }
}
`,
  },
  javascript: {
    monaco: 'javascript',
    template: `const input = require('fs').readFileSync(0, 'utf8').trim();
const lines = input.split('\\n');
// Lee la entrada, por ejemplo: const a = Number(lines[0]);

// Imprime la respuesta
console.log('');
`,
  },
  python: {
    monaco: 'python',
    template: `import sys

lines = sys.stdin.read().strip().split('\\n')
# Lee la entrada, por ejemplo: a = int(lines[0])

# Imprime la respuesta
print('')
`,
  },
  typescript: {
    monaco: 'typescript',
    template: `// Escribe tu solución aquí\n`,
  },
};

export function getMonacoLanguage(code: string): string {
  return TEMPLATES[code]?.monaco ?? 'plaintext';
}

export function getTemplate(code: string): string {
  return TEMPLATES[code]?.template ?? '';
}

// Borradores del candidato en el navegador: así no pierde el código
// al cambiar de lenguaje, de pregunta o al recargar la página.
const draftKey = (sessionId: string, questionId: string, languageCode: string) =>
  `draft:${sessionId}:${questionId}:${languageCode}`;

export function loadDraft(sessionId: string, questionId: string, languageCode: string): string {
  try {
    return (
      localStorage.getItem(draftKey(sessionId, questionId, languageCode)) ??
      getTemplate(languageCode)
    );
  } catch {
    return getTemplate(languageCode);
  }
}

export function saveDraft(
  sessionId: string,
  questionId: string,
  languageCode: string,
  code: string,
): void {
  try {
    localStorage.setItem(draftKey(sessionId, questionId, languageCode), code);
  } catch {
    // Almacenamiento no disponible (modo privado): se ignora.
  }
}
