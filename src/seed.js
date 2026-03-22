import { db } from './db/db';

async function seedLore() {
  const universes = await db.universes.toArray();
  if (universes.length > 0) {
    const lore = `
    # El Despertar de los Eternos: Lore de Astraea

    ## El Origen
    En el principio, solo existía el Vacío Argento. De las corrientes de energía pura nació Xal'thull, el Teje-Mundos. Con su sangre creó los océanos de éter y con su aliento las cumbres de cristal que hoy forman el continente de Astraea.

    ## El Gran Cisma
    Hace tres eras, la humanidad descubrió el "Eco del Olvido", una fuente de poder que permitía alterar la realidad. Esto llevó a una guerra civil que fragmentó el mundo en islas flotantes, conectadas solo por los Puentes de Luz Sólida.

    ## Las Leyes de la Magia
    La magia en Astraea no es un don, es una deuda. Cada hechizo consume un fragmento de la memoria del lanzador. Los "Desmemoriados" son aquellos magos que, en su búsqueda de poder absoluto, olvidaron incluso su propio nombre.

    ## Culturas Destacadas
    1. **Los Celestas**: Habitan en las ciudades de las nubes, adorando al Sol de Medianoche.
    2. **Los Hierro-Sangre**: Guerreros que habitan las minas abisales, donde el metal tiene conciencia.
    `;
    
    await db.universes.update(universes[0].id, { lore });
    console.log("Lore sembrado con éxito.");

    // Añadir algunas misiones de ejemplo
    const chars = await db.characters.toArray();
    if (chars.length > 0) {
      await db.missions.add({
        universeId: universes[0].id,
        characterId: chars[0].id,
        title: "La Recuperación del Eco",
        description: "Viajar a las ruinas de Stratholme para recuperar el fragmento del Eco del Olvido.",
        status: "en-progreso"
      });
      await db.missions.add({
        universeId: universes[0].id,
        characterId: chars[0].id,
        title: "El Juicio de los Celestas",
        description: "Demostrar la valía ante el Concilio de las Nubes.",
        status: "pendiente"
      });
    }
  }
}

seedLore();
