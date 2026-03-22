import { db } from './db/db';

export async function seedStaircaseData(universeId) {
  // Clear any existing staircase data for this universe first to avoid duplicates or old formats
  await db.staircase.where({ universeId }).delete();

  // 1. Create or verify 3 Characters
  const charData = [
    { name: 'Alys Thorne', role: 'Protagonista - La Tejedora', description: 'Una joven que descubre el poder de alterar la realidad.', universeId, imageUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200' },
    { name: 'Kaelen el Renegado', role: 'Mentor / Antagonista', description: 'Un antiguo maestro que busca redención o venganza.', universeId, imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200' },
    { name: 'Zoran Vane', role: 'Aliado Peligroso', description: 'Un mercenario con un secreto que podría destruir el mundo.', universeId, imageUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200' }
  ];

  const charIds = [];
  for (const c of charData) {
    // Check if character already exists by name in this universe
    let existing = await db.characters.where({ name: c.name, universeId }).first();
    if (!existing) {
      const id = await db.characters.add(c);
      charIds.push({ name: c.name, id });
    } else {
      charIds.push({ name: existing.name, id: existing.id });
    }
  }

  // 2. Define first 5 Steps of Snyder with narratives and char summaries
  const steps = [
    {
      title: "Imagen Inicial",
      content: "Vemos a @Alys Thorne en el pacífico pueblo de Valleverde, ajena al poder que duerme en su sangre. @Kaelen la observa desde los riscos.",
      charSummaries: {
        [charIds[0].id]: "Alys vive una vida simple, ignorando su linaje de Tejedora.",
        [charIds[1].id]: "Kaelen confirma que la profecía está a punto de cumplirse."
      },
      characterIds: [charIds[0].id, charIds[1].id]
    },
    {
      title: "Declaración del Tema",
      content: "Un anciano ciego detiene a @Alys para decirle: 'Solo quien sepa que el mundo es un hilo podrá salvar el tapiz'.",
      charSummaries: { [charIds[0].id]: "Alys comienza a sospechar que su realidad es más frágil de lo que parece." },
      characterIds: [charIds[0].id]
    },
    {
      title: "Planteamiento",
      content: "@Alys lucha con sus responsabilidades mientras @Zoran Vane llega al pueblo buscando un mapa antiguo.",
      charSummaries: {
        [charIds[0].id]: "Alys se siente atraída por el peligro que emana de Zoran.",
        [charIds[2].id]: "Zoran busca el mapa que le permitirá escapar de lo que Kaelen le obliga a hacer."
      },
      characterIds: [charIds[0].id, charIds[2].id]
    },
    {
      title: "Catalizador",
      content: "El pueblo es invadido por sombras. @Alys manifiesta su poder para salvar a @Zoran, desvaneciendo a los enemigos.",
      charSummaries: {
        [charIds[0].id]: "El despertar de la Tejedora. Alys ya no puede volver atrás.",
        [charIds[2].id]: "Zoran queda atónito ante el poder de la chica que debía usar."
      },
      characterIds: [charIds[0].id, charIds[2].id]
    },
    {
      title: "Debate",
      content: "@Alys Thorne se refugia con @Kaelen. Él le explica quién es ella, pero @Alys duda de sus oscuros motivos.",
      charSummaries: {
        [charIds[0].id]: "Confusión total. Alys debe decidir si confiar en un extraño o huir.",
        [charIds[1].id]: "Kaelen juega con los miedos de Alys para reclutarla."
      },
      characterIds: [charIds[0].id, charIds[1].id]
    }
  ];

  // Fill the rest of the 15 steps with empty format to avoid crashes
  const fullSteps = [...steps];
  for (let i = 5; i < 15; i++) {
    fullSteps.push({ content: '', characterIds: [], charSummaries: {} });
  }

  await db.staircase.add({
    universeId,
    steps: JSON.stringify(fullSteps)
  });
}
