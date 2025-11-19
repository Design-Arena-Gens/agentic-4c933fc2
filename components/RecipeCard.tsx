import { clsx } from "clsx";
import { Recipe } from "@/lib/types";

type Props = {
  recipe: Recipe;
  index: number;
};

export const RecipeCard = ({ recipe, index }: Props) => {
  return (
    <article
      className={clsx(
        "rounded-3xl border border-slate-200/70 bg-white/80 p-6 shadow-xl shadow-slate-900/5 transition hover:-translate-y-1 hover:shadow-glow",
        "backdrop-blur-sm"
      )}
    >
      <header className="mb-4 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand/10 font-semibold text-brand">
          {index + 1}
        </div>
        <div>
          <h3 className="text-xl font-semibold text-slate-900">{recipe.title}</h3>
          <p className="text-sm text-slate-600">{recipe.description}</p>
        </div>
      </header>

      <section className="mb-4">
        <h4 className="mb-1 text-sm font-semibold uppercase tracking-wide text-slate-500">Ingredients</h4>
        <ul className="list-inside list-disc space-y-1 text-sm text-slate-700">
          {recipe.ingredients.map((ingredient) => (
            <li key={ingredient}>{ingredient}</li>
          ))}
        </ul>
      </section>

      <section>
        <h4 className="mb-1 text-sm font-semibold uppercase tracking-wide text-slate-500">Steps</h4>
        <ol className="list-inside list-decimal space-y-1 text-sm text-slate-700">
          {recipe.steps.map((step, stepIndex) => (
            <li key={stepIndex}>{step}</li>
          ))}
        </ol>
      </section>
    </article>
  );
};
