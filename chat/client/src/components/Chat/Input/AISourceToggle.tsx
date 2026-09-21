import { useCallback, useMemo } from 'react';
import { Cpu, Cloud } from 'lucide-react';
import { EModelEndpoint } from 'librechat-data-provider';
import { useChatContext } from '~/Providers';
import { useNewConvo } from '~/hooks';
import { cn } from '~/utils';

/** Models served by Ollama (local) — matches names in terramind.yaml */
const LOCAL_MODELS = new Set([
  'qwen2.5-coder:7b',
  'qwen2.5-coder:14b',
  'qwen2.5-coder:32b',
  'deepseek-coder-v2:16b',
  'codellama:7b',
  'codellama:13b',
  'codellama:34b',
  'mistral-nemo:12b',
  'mistral-small:24b',
  'llama3.1:8b',
  'llama3.1:70b',
  'llama3.2:1b',
  'llama3.2:3b',
  'llama3.3:70b',
  'starcoder2:7b',
  'starcoder2:15b',
  'sqlcoder:7b',
  'sqlcoder:15b',
]);

/** Default model to select when switching to each mode */
const DEFAULT_LOCAL_MODEL = 'qwen2.5-coder:7b';
const DEFAULT_API_MODEL = 'gpt-4o';
const DEFAULT_API_ENDPOINT = EModelEndpoint.openAI;
const OLLAMA_ENDPOINT = 'Ollama'; // matches terramind.yaml custom name

type AISourceMode = 'local' | 'api';

function isLocalMode(endpoint?: string | null, model?: string | null): boolean {
  if (endpoint === OLLAMA_ENDPOINT) return true;
  if (model && LOCAL_MODELS.has(model)) return true;
  return false;
}

interface AISourceToggleProps {
  /** Index of this composer (0 = primary) */
  index?: number;
  /** Whether a submission is in flight — disables the toggle */
  isSubmitting?: boolean;
}

export default function AISourceToggle({ index = 0, isSubmitting = false }: AISourceToggleProps) {
  const { conversation } = useChatContext();
  const { newConversation } = useNewConvo(index);

  const currentMode: AISourceMode = useMemo(
    () =>
      isLocalMode(conversation?.endpoint, conversation?.model) ? 'local' : 'api',
    [conversation?.endpoint, conversation?.model],
  );

  const switchTo = useCallback(
    (mode: AISourceMode) => {
      if (isSubmitting) return;
      if (mode === currentMode) return;

      if (mode === 'local') {
        newConversation({
          template: {
            endpoint: OLLAMA_ENDPOINT,
            endpointType: EModelEndpoint.custom,
            model: DEFAULT_LOCAL_MODEL,
          },
          buildDefault: false,
        });
      } else {
        newConversation({
          template: {
            endpoint: DEFAULT_API_ENDPOINT,
            model: DEFAULT_API_MODEL,
          },
          buildDefault: false,
        });
      }
    },
    [currentMode, isSubmitting, newConversation],
  );

  const baseBtn =
    'relative flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring-primary select-none';

  return (
    <div
      className={cn(
        'flex items-center gap-1 rounded-full border border-border-light bg-surface-secondary p-0.5',
        isSubmitting && 'opacity-50 cursor-not-allowed',
      )}
      title="Switch AI source"
      role="group"
      aria-label="AI source toggle"
    >
      {/* ── Local ─────────────────────────────────────── */}
      <button
        id="ai-source-local"
        type="button"
        disabled={isSubmitting}
        aria-pressed={currentMode === 'local'}
        onClick={() => switchTo('local')}
        className={cn(
          baseBtn,
          currentMode === 'local'
            ? 'bg-surface-tertiary text-text-primary shadow-sm'
            : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover',
        )}
      >
        <Cpu
          className={cn(
            'h-3.5 w-3.5 transition-colors',
            currentMode === 'local' ? 'text-green-400' : 'text-text-tertiary',
          )}
          aria-hidden="true"
        />
        <span>Local</span>
        {currentMode === 'local' && (
          <span className="absolute right-1.5 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
        )}
      </button>

      {/* ── API Key ───────────────────────────────────── */}
      <button
        id="ai-source-api"
        type="button"
        disabled={isSubmitting}
        aria-pressed={currentMode === 'api'}
        onClick={() => switchTo('api')}
        className={cn(
          baseBtn,
          currentMode === 'api'
            ? 'bg-surface-tertiary text-text-primary shadow-sm'
            : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover',
        )}
      >
        <Cloud
          className={cn(
            'h-3.5 w-3.5 transition-colors',
            currentMode === 'api' ? 'text-blue-400' : 'text-text-tertiary',
          )}
          aria-hidden="true"
        />
        <span>API Key</span>
        {currentMode === 'api' && (
          <span className="absolute right-1.5 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
        )}
      </button>
    </div>
  );
}
