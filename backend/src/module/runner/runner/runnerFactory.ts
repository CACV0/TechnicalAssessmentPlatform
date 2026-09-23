import { CodeRunner, LanguageRunnerConfig } from '../types/runnerTypes';
import DockerCodeRunner from './dockerCodeRunner';

const LANGUAGE_CONFIGS: LanguageRunnerConfig[] = [
	{
		code: 'java',
		image: 'eclipse-temurin:21-jdk',
		fileName: 'Main.java',
		prepareCommand: ['javac', 'Main.java'],
		prepareNeedsWritableWorkspace: true,
		runCommand: ['java', 'Main'],
	},
	{
		code: 'javascript',
		image: 'node:24-alpine',
		fileName: 'main.js',
		prepareCommand: ['node', '--check', 'main.js'],
		prepareNeedsWritableWorkspace: false,
		runCommand: ['node', 'main.js'],
	},
	{
		code: 'python',
		image: 'python:3.12-alpine',
		fileName: 'main.py',
		prepareCommand: ['python', '-m', 'py_compile', 'main.py'],
		prepareNeedsWritableWorkspace: false,
		runCommand: ['python', '-B', 'main.py'],
		env: {
			PYTHONPYCACHEPREFIX: '/tmp/pycache',
			PYTHONDONTWRITEBYTECODE: '1',
		},
	},
];

const runners = new Map<string, CodeRunner>(
	LANGUAGE_CONFIGS.map((config) => [config.code, new DockerCodeRunner(config)])
);

class RunnerFactory {
	public getRunner(languageCode: string): CodeRunner | null {
		return runners.get(languageCode.toLowerCase()) ?? null;
	}
}

export default new RunnerFactory();
