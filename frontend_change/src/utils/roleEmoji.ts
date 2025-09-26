// 역할명에 따라 어울리는 이모지를 반환
export function getEmojiForRoleName(roleName: string): string {
  if (!roleName) return '😀';
  const name = roleName.trim();
  if (/요리사|쉐프|chef/i.test(name)) return '👩‍🍳';
  if (/간호사|nurse/i.test(name)) return '🏥';
  if (/의사|doctor/i.test(name)) return '🩺';
  if (/작가|writer|소설가/i.test(name)) return '✍️';
  if (/운동선수|선수|player|athlete/i.test(name)) return '🏃‍♂️';
  if (/화가|artist|화백/i.test(name)) return '🎨';
  if (/교사|선생|teacher/i.test(name)) return '🧑‍🏫';
  if (/개발자|프로그래머|engineer|coder|developer/i.test(name)) return '🧑‍💻';
  if (/과학자|scientist/i.test(name)) return '🧑‍🔬';
  if (/소방관|firefighter/i.test(name)) return '🧑‍🚒';
  if (/판사|변호사|lawyer|judge/i.test(name)) return '🧑‍⚖️';
  if (/정비사|기술자|mechanic/i.test(name)) return '🧑‍🔧';
  if (/농부|farmer/i.test(name)) return '🧑‍🌾';
  if (/가수|singer|뮤지션|musician/i.test(name)) return '🧑‍🎤';
  if (/조종사|pilot/i.test(name)) return '🧑‍✈️';
  if (/우주인|astronaut/i.test(name)) return '🧑‍🚀';
  // 기본값
  return '😀';
}