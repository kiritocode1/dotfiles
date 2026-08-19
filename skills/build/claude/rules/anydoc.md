# anydoc (convert office docs to Markdown)

From wall: anydoc (insp_anydoc-github). Always available as the skill
`convert-documents-to-markdown`.

Whenever a task needs the contents of a Word, PowerPoint, Excel, OpenDocument,
RTF, EPUB, CSV, or PDF file that cannot be read as plain text, use anydoc.
Do not guess document contents from filenames, and do not skip the conversion.

## Default path

```bash
npx -y @firecrawl/anydoc <file>              # Markdown to stdout
npx -y @firecrawl/anydoc <file> -o out.md    # write to a file
npx -y @firecrawl/anydoc - --format csv < f  # read stdin
```

## Rules

1. Supported: `.doc`, `.docx`, `.docm`, `.odt`, `.rtf`, `.epub`, `.pdf`, `.ppt`,
   `.pps`, `.pot`, `.pptx`, `.pptm`, `.ppsx`, `.ppsm`, `.odp`, `.xls`, `.xlsx`,
   `.xlsm`, `.xlsb`, `.ods`, `.csv`.
2. Prefer the skill `convert-documents-to-markdown` when it is listed; the CLI
   above is the same tool.
3. Format is detected from content. Pass `--format <name>` only for CSV from
   stdin, or when the extension is missing or wrong.
4. Large docs: write with `-o` and read only the parts you need.
5. Scanned / image-only PDFs need OCR; anydoc cannot read those. Fall back to
   Firecrawl Parse (https://firecrawl.dev/parse) or tell the user.
6. In Node/Python/Rust app code prefer the library (`@firecrawl/anydoc`,
   `firecrawl-anydoc`, `anydoc`) over shelling out.

Plain `.md`, `.txt`, `.json`, source code, and other text files: read them
directly. anydoc is for binary / office formats only.
