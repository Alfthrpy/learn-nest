const GRID_COLUMNS = 10;
const START_LONGITUDE = 107.55;
const START_LATITUDE = -6.82;
const CELL_SIZE = 0.012;

export const createDistrictData = (count: number) =>
  Array.from({ length: count }, (_, index) => {
    const row = Math.floor(index / GRID_COLUMNS);
    const column = index % GRID_COLUMNS;
    const name = `District ${String(index + 1).padStart(3, '0')}`;
    const minLongitude = START_LONGITUDE + column * CELL_SIZE;
    const minLatitude = START_LATITUDE - row * CELL_SIZE;
    const maxLongitude = minLongitude + CELL_SIZE * 0.8;
    const maxLatitude = minLatitude - CELL_SIZE * 0.8;

    return {
      name,
      description: `Wilayah administratif ${name}`,
      properties: { district: name },
      geojson: {
        type: 'Polygon',
        coordinates: [
          [
            [minLongitude, minLatitude],
            [maxLongitude, minLatitude],
            [maxLongitude, maxLatitude],
            [minLongitude, maxLatitude],
            [minLongitude, minLatitude],
          ],
        ],
      },
    };
  });