import { gardenEase, gardenPercent } from './gardenAnimation';

// Rounded tutorial silhouette, enriched in overlapping layers over the same 100 days.
export const profileCanopy = [[139, 133, 39], [182, 94, 44], [218, 123, 41], [127, 171, 35], [218, 168, 39], [176, 150, 47], [104, 140, 27], [125, 98, 30], [151, 74, 29], [199, 63, 27], [237, 96, 30], [258, 133, 26], [251, 170, 28], [202, 193, 28], [155, 192, 31], [104, 181, 24], [168, 117, 31], [212, 141, 35]];
export const profileBranches = [[139, 137, 181], [218, 119, 160], [128, 180, 206], [219, 190, 222], [182, 94, 150], [105, 142, 186], [130, 99, 166], [235, 98, 155], [253, 167, 204], [153, 76, 138]];
export const profileFlowers = [[142, 157], [216, 140], [183, 117], [127, 180], [224, 177], [172, 83], [151, 111], [190, 185], [106, 141], [131, 82], [204, 65], [242, 108], [254, 155], [157, 189], [230, 146], [191, 146]];
export const profileFruits = [[127, 139], [163, 107], [211, 111], [241, 141], [218, 185], [151, 181], [105, 167], [188, 79], [226, 85], [178, 155], [146, 74], [258, 164]];
export const profileSprigs = [[110, 121, -35], [135, 95, 25], [164, 61, -20], [210, 80, 32], [243, 118, -28], [253, 163, 25], [222, 185, -40], [174, 189, 18], [119, 175, -25], [157, 139, 35], [194, 119, -25], [208, 156, 20]];
export const profileMilestones = [
  { day: 0, label: 'Graine' }, { day: 7, label: 'Racines' }, { day: 19, label: 'Première pousse' },
  { day: 28, label: 'Branches' }, { day: 38, label: 'Bourgeons' }, { day: 48, label: 'Feuillage' },
  { day: 62, label: 'Couronne généreuse' }, { day: 76, label: 'Floraison' },
  { day: 86, label: 'Premiers fruits' }, { day: 94, label: 'Jardin vivant' }, { day: 100, label: 'Épanoui' },
];
export function profileStage(days: number) { return [...profileMilestones].reverse().find(step => gardenPercent(days) >= step.day) ?? profileMilestones[0]; }

export function profileTreeState(days: number) {
  'worklet';
  const day = gardenPercent(days);
  return {
    seed: 1 - gardenEase(day, 15, 31),
    seedOpen: gardenEase(day, 0, 19),
    trunk: gardenEase(day, 15, 48),
    trunkWidth: 2 + 8 * gardenEase(day, 28, 85),
    shoot: gardenEase(day, 15, 31) * (1 - gardenEase(day, 43, 58)),
  };
}
export function profileRoot(day: number, index: number) {
  'worklet'; return gardenEase(gardenPercent(day), 1 + index * .5, 12 + index * .75);
}
export function profileBranch(day: number, index: number) {
  'worklet'; return gardenEase(gardenPercent(day), 23 + index * 2, 40 + index * 2.4);
}
export function profileLeaf(day: number, index: number) {
  'worklet'; return index < 6 ? gardenEase(gardenPercent(day), 34 + index * 1.6, 58 + index * 2.4) : gardenEase(gardenPercent(day), 48 + (index - 6) * .9, 67 + (index - 6) * 1.2);
}
export function profileFlower(day: number, index: number) {
  'worklet'; return gardenEase(gardenPercent(day), 70 + index * .9, 82 + index * .9);
}
export function profileFruit(day: number, index: number) {
  'worklet'; return gardenEase(gardenPercent(day), 82 + index * .7, 92 + index * .7);
}
export function profileDetail(day: number, index: number) {
  'worklet'; return gardenEase(gardenPercent(day), 50 + index, 68 + index * 1.4);
}
export function profileBud(day: number, index: number) {
  'worklet'; const d = gardenPercent(day); return gardenEase(d, 30 + index, 38 + index) * (1 - gardenEase(d, 45 + index, 58 + index));
}
export function profileGrass(day: number, index: number) {
  'worklet'; return gardenEase(gardenPercent(day), 60 + index * 3, 82 + index * 3);
}
