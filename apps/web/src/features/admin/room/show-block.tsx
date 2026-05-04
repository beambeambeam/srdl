export default function Showblock({ answer }: { answer: string }) {
  return (
    <section className="flex w-full max-w-6xl flex-col items-center gap-8 text-center">
      <div className="w-full max-w-5xl rounded-[2rem] border border-border/60 bg-card/80 px-6 py-10 shadow-2xl shadow-black/20 backdrop-blur-sm sm:px-10 sm:py-14 lg:px-16">
        <blockquote className="font-heading text-3xl leading-tight text-balance sm:text-4xl lg:text-6xl">
          “{answer}”
        </blockquote>
      </div>
    </section>
  );
}
