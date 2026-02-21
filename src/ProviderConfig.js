/**
 * Centralized provider configuration table.
 * Eliminates duplication in env var checking and error messages.
 * Each entry defines how to validate API keys and provide help.
 */
const PROVIDER_CONFIGS = [
	{
		provider: 'openai',
		envVar: 'OPENAI_API_KEY',
		errorMsg: `OpenAI API key is missing. Set the OPENAI_API_KEY environment variable.`,
	},
	{
		provider: 'cerebras',
		envVar: 'CEREBRAS_API_KEY',
		errorMsg:
			`Cerebras API key is missing. Set the CEREBRAS_API_KEY environment variable.\n\n` +
			`To get an API key:\n` +
			`1. Visit https://inference-docs.cerebras.ai/\n` +
			`2. Sign up and get your API key\n` +
			`3. Export it: export CEREBRAS_API_KEY=your_key_here`,
	},
	{
		provider: 'huggingface',
		envVar: 'HF_TOKEN',
		fallbackVar: 'HUGGINGFACE_API_KEY',
		errorMsg: `Hugging Face API key is missing. Set the HF_TOKEN environment variable.`,
	},
	{
		provider: 'openrouter',
		envVar: 'OPENROUTER_API_KEY',
		errorMsg: `OpenRouter API key is missing. Set the OPENROUTER_API_KEY environment variable.`,
	},
	{
		provider: 'llamacpp',
		envVar: '',
	},
]

/**
 * Validates API key for a provider and throws if missing.
 * @param {string} provider - Provider name (e.g., 'openai')
 * @throws {Error} If API key is missing, with provider-specific help.
 */
export function validateApiKey(provider) {
	const config = PROVIDER_CONFIGS.find((c) => c.provider === provider)
	if (!config) {
		throw new Error(`Unknown provider: ${provider}`)
	}
	if (!config.envVar) return
	const key =
		process.env[config.envVar] || (config.fallbackVar ? process.env[config.fallbackVar] : undefined)
	if (!key) {
		throw new Error(config.errorMsg)
	}
}
