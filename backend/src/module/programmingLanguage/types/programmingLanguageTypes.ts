export interface ProgrammingLanguage {
	id: string;
	name: string;
	code: string;
	version: string | null;
	isActive: boolean;
}

export interface UpdateQuestionLanguagesRequest {
	languageIds: string[];
}
