import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Code,
  Eye,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Image as ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  RemoveFormatting,
  Strikethrough,
  Underline,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface RichTextEditorProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}

export function RichTextEditor({ value, onChange, placeholder = "Mulai menulis di sini..." }: RichTextEditorProps) {
  const [isSourceMode, setIsSourceMode] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const lastHtmlRef = useRef(value);

  const [activeStates, setActiveStates] = useState({
    bold: false,
    italic: false,
    underline: false,
    strikeThrough: false,
    justifyLeft: false,
    justifyCenter: false,
    justifyRight: false,
    justifyFull: false,
    insertUnorderedList: false,
    insertOrderedList: false,
    heading: "p",
  });

  // Keep editor content in sync with external value change (e.g. loading article)
  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = value || "";
      lastHtmlRef.current = value || "";
    }
  }, [value, isSourceMode]); // Also sync on switching modes

  const handleInput = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      // If editor has just empty line or empty tags, normalize to empty string
      const normalizedHtml = html === "<br>" || html === "<div><br></div>" || html === "<p><br></p>" ? "" : html;
      lastHtmlRef.current = normalizedHtml;
      onChange(normalizedHtml);
    }
  };

  const executeCommand = (command: string, arg: string = "") => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
    document.execCommand(command, false, arg);
    handleInput();
    updateToolbarStates();
  };

  const updateToolbarStates = () => {
    if (isSourceMode) return;

    let currentHeading = "p";
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      let parent = selection.getRangeAt(0).startContainer.parentNode as HTMLElement | null;
      while (parent && parent !== editorRef.current) {
        if (parent.tagName) {
          const tag = parent.tagName.toLowerCase();
          if (["h1", "h2", "h3", "h4", "blockquote"].includes(tag)) {
            currentHeading = tag;
            break;
          }
        }
        parent = parent.parentElement;
      }
    }

    setActiveStates({
      bold: document.queryCommandState("bold"),
      italic: document.queryCommandState("italic"),
      underline: document.queryCommandState("underline"),
      strikeThrough: document.queryCommandState("strikeThrough"),
      justifyLeft: document.queryCommandState("justifyLeft"),
      justifyCenter: document.queryCommandState("justifyCenter"),
      justifyRight: document.queryCommandState("justifyRight"),
      justifyFull: document.queryCommandState("justifyFull"),
      insertUnorderedList: document.queryCommandState("insertUnorderedList"),
      insertOrderedList: document.queryCommandState("insertOrderedList"),
      heading: currentHeading,
    });
  };

  const handleLink = () => {
    const selection = window.getSelection();
    let defaultUrl = "https://";
    if (selection && selection.toString()) {
      // If it's a URL already, use it as default
      if (selection.toString().match(/^https?:\/\//)) {
        defaultUrl = selection.toString();
      }
    }
    const url = prompt("Masukkan URL Link:", defaultUrl);
    if (url !== null) {
      executeCommand("createLink", url);
    }
  };

  const handleImage = () => {
    const url = prompt("Masukkan URL Gambar:");
    if (url) {
      executeCommand("insertImage", url);
    }
  };

  const handleFormatBlock = (tag: string) => {
    executeCommand("formatBlock", `<${tag}>`);
  };

  const handleTextColor = (e: React.ChangeEvent<HTMLInputElement>) => {
    executeCommand("foreColor", e.target.value);
  };

  const handleBgColor = (e: React.ChangeEvent<HTMLInputElement>) => {
    // For background colors, 'hiliteColor' is standard for browsers, 'backColor' is alternative
    executeCommand("hiliteColor", e.target.value);
  };

  return (
    <div className="flex flex-col rounded-xl border border-slate-300 bg-slate-50 overflow-hidden shadow-inner">
      {/* Editor Word-Style Toolbar */}
      <div className="flex flex-wrap items-center gap-1 border-b border-slate-300 bg-white p-2.5 shadow-sm">
        {/* Style Dropdown */}
        <div className="flex items-center pr-2 border-r border-slate-200">
          <select
            value={activeStates.heading}
            disabled={isSourceMode}
            onChange={(e) => handleFormatBlock(e.target.value)}
            className="rounded border border-slate-300 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-700 focus:border-[#0F766E] focus:outline-none disabled:opacity-50"
          >
            <option value="p">Paragraph</option>
            <option value="h1">Heading 1</option>
            <option value="h2">Heading 2</option>
            <option value="h3">Heading 3</option>
            <option value="h4">Heading 4</option>
            <option value="blockquote">Kutipan</option>
          </select>
        </div>

        {/* Font formatting actions */}
        <div className="flex items-center gap-0.5 px-1.5 border-r border-slate-200">
          <button
            type="button"
            disabled={isSourceMode}
            onClick={() => executeCommand("bold")}
            className={`rounded p-1.5 transition ${
              activeStates.bold
                ? "bg-teal-50 text-[#0F766E] font-bold"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            } disabled:opacity-50`}
            title="Bold (Ctrl+B)"
          >
            <Bold className="h-4 w-4" />
          </button>
          <button
            type="button"
            disabled={isSourceMode}
            onClick={() => executeCommand("italic")}
            className={`rounded p-1.5 transition ${
              activeStates.italic
                ? "bg-teal-50 text-[#0F766E]"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            } disabled:opacity-50`}
            title="Italic (Ctrl+I)"
          >
            <Italic className="h-4 w-4" />
          </button>
          <button
            type="button"
            disabled={isSourceMode}
            onClick={() => executeCommand("underline")}
            className={`rounded p-1.5 transition ${
              activeStates.underline
                ? "bg-teal-50 text-[#0F766E]"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            } disabled:opacity-50`}
            title="Underline (Ctrl+U)"
          >
            <Underline className="h-4 w-4" />
          </button>
          <button
            type="button"
            disabled={isSourceMode}
            onClick={() => executeCommand("strikeThrough")}
            className={`rounded p-1.5 transition ${
              activeStates.strikeThrough
                ? "bg-teal-50 text-[#0F766E]"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            } disabled:opacity-50`}
            title="Strikethrough"
          >
            <Strikethrough className="h-4 w-4" />
          </button>

          {/* Text Color Picker */}
          <label
            className="relative cursor-pointer rounded p-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition flex items-center justify-center disabled:opacity-50"
            title="Warna Teks"
          >
            <span className="text-[10px] font-bold border-b-2 border-red-500 leading-none">A</span>
            <input
              type="color"
              disabled={isSourceMode}
              onChange={handleTextColor}
              className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
            />
          </label>

          {/* Highlight Color Picker */}
          <label
            className="relative cursor-pointer rounded p-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition flex items-center justify-center disabled:opacity-50"
            title="Warna Sorotan"
          >
            <span className="text-[10px] bg-yellow-250 border border-slate-350 px-0.5 rounded font-bold leading-none">ab</span>
            <input
              type="color"
              disabled={isSourceMode}
              onChange={handleBgColor}
              className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
            />
          </label>
        </div>

        {/* Alignment actions */}
        <div className="flex items-center gap-0.5 px-1.5 border-r border-slate-200">
          <button
            type="button"
            disabled={isSourceMode}
            onClick={() => executeCommand("justifyLeft")}
            className={`rounded p-1.5 transition ${
              activeStates.justifyLeft
                ? "bg-teal-50 text-[#0F766E]"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            } disabled:opacity-50`}
            title="Rata Kiri"
          >
            <AlignLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            disabled={isSourceMode}
            onClick={() => executeCommand("justifyCenter")}
            className={`rounded p-1.5 transition ${
              activeStates.justifyCenter
                ? "bg-teal-50 text-[#0F766E]"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            } disabled:opacity-50`}
            title="Rata Tengah"
          >
            <AlignCenter className="h-4 w-4" />
          </button>
          <button
            type="button"
            disabled={isSourceMode}
            onClick={() => executeCommand("justifyRight")}
            className={`rounded p-1.5 transition ${
              activeStates.justifyRight
                ? "bg-teal-50 text-[#0F766E]"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            } disabled:opacity-50`}
            title="Rata Kanan"
          >
            <AlignRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            disabled={isSourceMode}
            onClick={() => executeCommand("justifyFull")}
            className={`rounded p-1.5 transition ${
              activeStates.justifyFull
                ? "bg-teal-50 text-[#0F766E]"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            } disabled:opacity-50`}
            title="Rata Kiri Kanan (Justify)"
          >
            <AlignJustify className="h-4 w-4" />
          </button>
        </div>

        {/* Lists & Inserts */}
        <div className="flex items-center gap-0.5 px-1.5 border-r border-slate-200">
          <button
            type="button"
            disabled={isSourceMode}
            onClick={() => executeCommand("insertUnorderedList")}
            className={`rounded p-1.5 transition ${
              activeStates.insertUnorderedList
                ? "bg-teal-50 text-[#0F766E]"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            } disabled:opacity-50`}
            title="Bullet List"
          >
            <List className="h-4 w-4" />
          </button>
          <button
            type="button"
            disabled={isSourceMode}
            onClick={() => executeCommand("insertOrderedList")}
            className={`rounded p-1.5 transition ${
              activeStates.insertOrderedList
                ? "bg-teal-50 text-[#0F766E]"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            } disabled:opacity-50`}
            title="Numbered List"
          >
            <ListOrdered className="h-4 w-4" />
          </button>
          <button
            type="button"
            disabled={isSourceMode}
            onClick={handleLink}
            className="rounded p-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition disabled:opacity-50"
            title="Sisipkan Link"
          >
            <LinkIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            disabled={isSourceMode}
            onClick={handleImage}
            className="rounded p-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition disabled:opacity-50"
            title="Sisipkan Gambar URL"
          >
            <ImageIcon className="h-4 w-4" />
          </button>
        </div>

        {/* Advanced / Clean / Switch */}
        <div className="flex items-center gap-0.5 pl-1.5 ml-auto">
          <button
            type="button"
            disabled={isSourceMode}
            onClick={() => executeCommand("removeFormat")}
            className="rounded p-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition disabled:opacity-50"
            title="Hapus Format"
          >
            <RemoveFormatting className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setIsSourceMode(!isSourceMode)}
            className={`rounded px-2.5 py-1.5 transition text-xs font-semibold flex items-center gap-1.5 border ${
              isSourceMode
                ? "bg-slate-800 text-white border-slate-800"
                : "bg-teal-550 text-white border-teal-550 hover:bg-[#0F766E]"
            }`}
            title={isSourceMode ? "Beralih ke Tampilan Word" : "Beralih ke Kode HTML"}
          >
            {isSourceMode ? (
              <>
                <Eye className="h-3.5 w-3.5" />
                Word View
              </>
            ) : (
              <>
                <Code className="h-3.5 w-3.5" />
                Kode HTML
              </>
            )}
          </button>
        </div>
      </div>

      {/* Editor Canvas Page (Word Style) */}
      <div className="bg-slate-100 p-4 sm:p-6 overflow-y-auto max-h-[550px] custom-scrollbar">
        {isSourceMode ? (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full max-w-3xl mx-auto block min-h-[450px] rounded-lg border border-slate-350 bg-slate-950 p-5 font-mono text-xs text-slate-200 outline-none focus:ring-1 focus:ring-slate-500"
            placeholder="<h1>Judul</h1><p>Tulis kode HTML di sini...</p>"
          />
        ) : (
          <div className="w-full max-w-3xl mx-auto rounded-md bg-white p-8 sm:p-12 shadow-md border border-slate-200 relative min-h-[450px] transition-all hover:shadow-lg">
            {/* Native style target */}
            <div
              ref={editorRef}
              contentEditable
              onInput={handleInput}
              onMouseUp={updateToolbarStates}
              onKeyUp={updateToolbarStates}
              onFocus={updateToolbarStates}
              onBlur={handleInput}
              className="wysiwyg-content outline-none min-h-[400px] text-slate-800 leading-relaxed text-sm break-words"
              style={{
                fontFamily: "Inter, Roboto, sans-serif",
              }}
            />
            {/* Elegant Placeholder */}
            {!value && (
              <div className="absolute top-12 left-12 pointer-events-none text-sm text-slate-400 select-none font-normal italic">
                {placeholder}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="bg-white border-t border-slate-250 px-3 py-1.5 flex items-center justify-between text-xs text-slate-500">
        <div>Mode: {isSourceMode ? "HTML Editor" : "Word Visual Editor"}</div>
        <div>
          {value ? (value.replace(/<[^>]*>/g, "").trim().split(/\s+/).filter(Boolean).length) : 0} Kata
        </div>
      </div>
    </div>
  );
}
