import { useEffect, useState } from "react";
import { Download, ExternalLink, FileUp, Search } from "lucide-react";
import { Modal } from "../ui/Modal";
import { api } from "../../lib/api";
import type { Appliance } from "../../stores/applianceStore";

interface ManualResult {
  title: string;
  url: string;
  description: string;
  is_pdf: boolean;
  source_domain: string;
}

interface ManualSearchResponse {
  results: ManualResult[];
  query_used: string;
  appliance_name: string;
}

type SearchState =
  | { phase: "idle" }
  | { phase: "searching" }
  | { phase: "results"; results: ManualResult[]; queryUsed: string; applianceName: string }
  | { phase: "error"; message: string };

interface ManualSearchModalProps {
  appliance: Appliance | null;
  isOpen: boolean;
  onClose: () => void;
  onUploadInstead: () => void;
}

export function ManualSearchModal({
  appliance,
  isOpen,
  onClose,
  onUploadInstead,
}: ManualSearchModalProps) {
  const [state, setState] = useState<SearchState>({ phase: "idle" });

  useEffect(() => {
    if (!isOpen || !appliance) return;
    setState({ phase: "searching" });
    api
      .post<ManualSearchResponse>("/manuals/search", { appliance_id: appliance.id })
      .then((data) =>
        setState({
          phase: "results",
          results: data.results,
          queryUsed: data.query_used,
          applianceName: data.appliance_name,
        })
      )
      .catch((err: Error) => setState({ phase: "error", message: err.message }));
  }, [isOpen, appliance?.id]);

  const handleClose = () => {
    setState({ phase: "idle" });
    onClose();
  };

  const modalTitle = appliance
    ? `Find Manual — ${[appliance.brand, appliance.model_number].filter(Boolean).join(" ") || appliance.name}`
    : "Find Manual";

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={modalTitle}
      footer={
        <button
          onClick={() => {
            handleClose();
            onUploadInstead();
          }}
          className="flex w-full items-center justify-center gap-2 text-sm text-warm-500 transition-colors hover:text-brand-600"
        >
          <FileUp className="h-3.5 w-3.5" />
          Upload a manual instead
        </button>
      }
    >
      <div className="space-y-3">
        {state.phase === "searching" && (
          <div className="flex flex-col items-center gap-3 py-10">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-warm-400 animate-bounce [animation-delay:0ms]" />
              <span className="h-2 w-2 rounded-full bg-warm-400 animate-bounce [animation-delay:150ms]" />
              <span className="h-2 w-2 rounded-full bg-warm-400 animate-bounce [animation-delay:300ms]" />
            </div>
            <p className="text-sm text-warm-500">Searching for manuals…</p>
          </div>
        )}

        {state.phase === "error" && (
          <div className="rounded-xl border border-red-100 bg-red-50 p-4">
            <p className="text-sm text-red-600">{state.message}</p>
          </div>
        )}

        {state.phase === "results" && state.results.length === 0 && (
          <div className="py-8 text-center">
            <Search className="mx-auto mb-3 h-8 w-8 text-warm-300" />
            <p className="text-sm font-medium text-warm-700">No manuals found</p>
            <p className="mt-1 text-xs text-warm-400">
              Try uploading your manual directly if you have the file.
            </p>
          </div>
        )}

        {state.phase === "results" && state.results.length > 0 && (
          <>
            <p className="text-xs text-warm-400">
              Results for: <span className="font-medium text-warm-600">{state.queryUsed}</span>
            </p>
            <div className="space-y-2">
              {state.results.map((result, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-warm-200 bg-white p-3.5 space-y-1.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-warm-900">
                        {result.title}
                      </p>
                      <p className="text-xs text-warm-400">{result.source_domain}</p>
                    </div>
                    <a
                      href={result.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      {...(result.is_pdf ? { download: true } : {})}
                      className="shrink-0 flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-brand-700"
                    >
                      {result.is_pdf ? (
                        <>
                          <Download className="h-3.5 w-3.5" />
                          Download PDF
                        </>
                      ) : (
                        <>
                          <ExternalLink className="h-3.5 w-3.5" />
                          View
                        </>
                      )}
                    </a>
                  </div>
                  {result.description && (
                    <p className="text-xs text-warm-600 line-clamp-2">{result.description}</p>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
