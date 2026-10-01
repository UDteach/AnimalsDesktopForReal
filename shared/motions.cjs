// Approved motion IDs for each species. The desktop app, website catalog, and
// asset check use this table so a new motion cannot silently drift between them.
const actionsBySpecies = {
  chinchilla: ['hop', 'perch', 'peek', 'bottom-pop'],
  hamster: ['forage', 'explore', 'peek', 'bottom-pop'],
  djungarian: ['dash', 'pause', 'peek', 'bottom-pop'],
  'macaroni-mouse': ['emerge', 'shuffle', 'settle', 'bottom-pop'],
  'sugar-glider': ['glide', 'perch', 'peek', 'bottom-pop'],
  'guinea-pig': ['trot', 'forage', 'popcorn', 'bottom-pop'],
  rabbit: ['hop', 'sniff', 'periscope', 'bottom-pop'],
  shoebill: ['perch', 'walk', 'clatter', 'bottom-pop'],
  marmot: ['periscope', 'groom', 'shuffle', 'bottom-pop'],
};

module.exports = { actionsBySpecies };
