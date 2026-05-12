const nodes = [
  { label: "A", x: "18%", y: "28%" },
  { label: "B", x: "46%", y: "18%" },
  { label: "C", x: "70%", y: "34%" },
  { label: "D", x: "36%", y: "66%" },
  { label: "E", x: "64%", y: "72%" },
];

export function GraphMock() {
  return (
    <section className="mx-auto flex h-full min-h-0 w-full max-w-5xl flex-col overflow-y-auto px-8 py-8">
      <div className="mb-5">
        <div className="text-xs uppercase text-zinc-400">
          Граф
        </div>
        <h1 className="mt-2 text-2xl font-medium text-zinc-950">Связи</h1>
      </div>

      <div className="relative min-h-[620px] relative h-48 rounded-lg border border-zinc-200 bg-white shadow-sm">
        <div className="absolute left-[18%] top-[28%] h-px w-[32%] rotate-[-13deg] bg-zinc-200" />
        <div className="absolute left-[45%] top-[24%] h-px w-[27%] rotate-[25deg] bg-zinc-200" />
        <div className="absolute left-[36%] top-[58%] h-px w-[34%] rotate-[9deg] bg-zinc-200" />
        <div className="absolute left-[27%] top-[42%] h-px w-[28%] rotate-[56deg] bg-zinc-200" />

        {nodes.map((node) => (
          <div
            className="absolute flex h-14 w-14 items-center justify-center rounded-full border border-zinc-200 bg-zinc-50 text-sm font-medium text-zinc-500 shadow-sm"
            key={node.label}
            style={{ left: node.x, top: node.y }}
          >
            {node.label}
          </div>
        ))}
      </div>
    </section>
  );
}
