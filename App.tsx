import React, {useEffect, useRef, useState, useMemo} from 'react';
import {
  Animated,
  AppState,
  Easing,
  Image,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  Vibration,
  View,
} from 'react-native';
import Sound from 'react-native-sound';

// ─── Types ────────────────────────────────────────────────────────────────────

type Screen = 'home' | 'customize' | 'game';

type CardItem = {
  image: ReturnType<typeof require>;
  name: string;
  sound: string;
  soundKey: string;
};

type Card = CardItem & {
  id: string;
  pairId: string;
};

type GridOption = {
  id: string;
  label: string;
  rows: number;
  columns: number;
};

type GameCategory = {
  id: string;
  label: string;
  icon: string;
  color: string;
  bgColor: string;
  items: CardItem[];
};

type CardBackTheme = {
  id: string;
  label: string;
  symbol: string;
  bgColor: string;
  borderColor: string;
};

type ResultPopup = {
  emoji: string;
  title: string;
  message: string;
  primaryActionLabel: string;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const GRID_OPTIONS: GridOption[] = [
  {id: '2x2', label: '2 x 2', rows: 2, columns: 2},
  {id: '3x4', label: '3 x 4', rows: 4, columns: 3},
  {id: '4x4', label: '4 x 4', rows: 4, columns: 4},
];

const SOUND_FILES = {
  background: 'kids_background.wav',
  click: 'card_click.wav',
  failure: 'failure.wav',
  success: 'success.wav',
  win: 'win_fanfare.wav',
  lose: 'game_over.wav',
} as const;

type SoundName = keyof typeof SOUND_FILES;
type LoadedSounds = Partial<Record<SoundName, Sound>>;

const SOUND_VOLUMES: Record<SoundName, number> = {
  background: 0.6,
  click: 0.75,
  failure: 1,
  success: 1,
  win: 1,
  lose: 1,
};

const CARD_BACK_THEMES: CardBackTheme[] = [
  {id: 'paw',     label: 'Paw Print', symbol: '🐾', bgColor: '#3D405B', borderColor: '#F2CC8F'},
  {id: 'stars',   label: 'Stars',     symbol: '⭐', bgColor: '#1A1A5E', borderColor: '#FFD700'},
  {id: 'hearts',  label: 'Hearts',    symbol: '❤️', bgColor: '#C0392B', borderColor: '#FFAAAA'},
  {id: 'space',   label: 'Space',     symbol: '🚀', bgColor: '#0D1B2A', borderColor: '#64DFDF'},
  {id: 'rainbow', label: 'Rainbow',   symbol: '🌈', bgColor: '#7B2D8B', borderColor: '#FFD700'},
  {id: 'ocean',   label: 'Ocean',     symbol: '🌊', bgColor: '#0077B6', borderColor: '#90E0EF'},
];

const CATEGORIES: GameCategory[] = [
  {
    id: 'animals',
    label: 'Animals',
    icon: '🦁',
    color: '#81B29A',
    bgColor: '#E6F4EE',
    items: [
      {image: require('./assets/images/animals/puppy.png'),    name: 'Puppy',    sound: 'Woof!',    soundKey: 'animal_puppy'},
      {image: require('./assets/images/animals/kitten.png'),   name: 'Kitten',   sound: 'Meow!',    soundKey: 'animal_kitten'},
      {image: require('./assets/images/animals/cow.png'),      name: 'Cow',      sound: 'Moo!',     soundKey: 'animal_cow'},
      {image: require('./assets/images/animals/frog.png'),     name: 'Frog',     sound: 'Ribbit!',  soundKey: 'animal_frog'},
      {image: require('./assets/images/animals/monkey.png'),   name: 'Monkey',   sound: 'Oo oo!',   soundKey: 'animal_monkey'},
      {image: require('./assets/images/animals/pig.png'),      name: 'Piglet',   sound: 'Oink!',    soundKey: 'animal_pig'},
      {image: require('./assets/images/animals/lion.png'),     name: 'Lion',     sound: 'Roar!',    soundKey: 'animal_lion'},
      {image: require('./assets/images/animals/chick.png'),    name: 'Chick',    sound: 'Peep!',    soundKey: 'animal_chick'},
      {image: require('./assets/images/animals/elephant.png'), name: 'Elephant', sound: 'Trumpet!', soundKey: 'animal_elephant'},
      {image: require('./assets/images/animals/duck.png'),     name: 'Duck',     sound: 'Quack!',   soundKey: 'animal_duck'},
    ],
  },
  {
    id: 'fruits',
    label: 'Fruits',
    icon: '🍎',
    color: '#E07A5F',
    bgColor: '#FDE8E3',
    items: [
      {image: require('./assets/images/fruits/apple.png'),      name: 'Apple',      sound: 'Yum!',   soundKey: 'fruit_apple'},
      {image: require('./assets/images/fruits/banana.png'),     name: 'Banana',     sound: 'Mmm!',   soundKey: 'fruit_banana'},
      {image: require('./assets/images/fruits/orange.png'),     name: 'Orange',     sound: 'Sweet!', soundKey: 'fruit_orange'},
      {image: require('./assets/images/fruits/grapes.png'),     name: 'Grapes',     sound: 'Munch!', soundKey: 'fruit_grapes'},
      {image: require('./assets/images/fruits/strawberry.png'), name: 'Strawberry', sound: 'Yummy!', soundKey: 'fruit_strawberry'},
      {image: require('./assets/images/fruits/watermelon.png'), name: 'Watermelon', sound: 'Slurp!', soundKey: 'fruit_watermelon'},
      {image: require('./assets/images/fruits/pineapple.png'),  name: 'Pineapple',  sound: 'Ooh!',   soundKey: 'fruit_pineapple'},
      {image: require('./assets/images/fruits/cherries.png'),   name: 'Cherries',   sound: 'Delish!',soundKey: 'fruit_cherries'},
      {image: require('./assets/images/fruits/mango.png'),      name: 'Mango',      sound: 'Ahh!',   soundKey: 'fruit_mango'},
      {image: require('./assets/images/fruits/pear.png'),       name: 'Pear',       sound: 'Nom!',   soundKey: 'fruit_pear'},
    ],
  },
  {
    id: 'vegetables',
    label: 'Veggies',
    icon: '🥕',
    color: '#4CAF50',
    bgColor: '#E8F5E9',
    items: [
      {image: require('./assets/images/vegetables/carrot.png'),   name: 'Carrot',   sound: 'Crunch!', soundKey: 'veg_carrot'},
      {image: require('./assets/images/vegetables/broccoli.png'), name: 'Broccoli', sound: 'Fresh!',  soundKey: 'veg_broccoli'},
      {image: require('./assets/images/vegetables/corn.png'),     name: 'Corn',     sound: 'Pop!',    soundKey: 'veg_corn'},
      {image: require('./assets/images/vegetables/tomato.png'),   name: 'Tomato',   sound: 'Squish!', soundKey: 'veg_tomato'},
      {image: require('./assets/images/vegetables/eggplant.png'), name: 'Eggplant', sound: 'Mmm!',    soundKey: 'veg_eggplant'},
      {image: require('./assets/images/vegetables/cucumber.png'), name: 'Cucumber', sound: 'Cool!',   soundKey: 'veg_cucumber'},
      {image: require('./assets/images/vegetables/potato.png'),   name: 'Potato',   sound: 'Yum!',    soundKey: 'veg_potato'},
      {image: require('./assets/images/vegetables/onion.png'),    name: 'Onion',    sound: 'Tears!',  soundKey: 'veg_onion'},
      {image: require('./assets/images/vegetables/pepper.png'),   name: 'Pepper',   sound: 'Hot!',    soundKey: 'veg_pepper'},
      {image: require('./assets/images/vegetables/mushroom.png'), name: 'Mushroom', sound: 'Snap!',   soundKey: 'veg_mushroom'},
    ],
  },
  {
    id: 'vehicles',
    label: 'Vehicles',
    icon: '🚗',
    color: '#5C7AEA',
    bgColor: '#E8EDFC',
    items: [
      {image: require('./assets/images/vehicles/car.png'),        name: 'Car',        sound: 'Vroom!', soundKey: 'vehicle_car'},
      {image: require('./assets/images/vehicles/bus.png'),        name: 'Bus',        sound: 'Honk!',  soundKey: 'vehicle_bus'},
      {image: require('./assets/images/vehicles/airplane.png'),   name: 'Airplane',   sound: 'Whoosh!',soundKey: 'vehicle_airplane'},
      {image: require('./assets/images/vehicles/ship.png'),       name: 'Ship',       sound: 'Toot!',  soundKey: 'vehicle_ship'},
      {image: require('./assets/images/vehicles/bicycle.png'),    name: 'Bicycle',    sound: 'Ring!',  soundKey: 'vehicle_bicycle'},
      {image: require('./assets/images/vehicles/motorcycle.png'), name: 'Motorcycle', sound: 'Brrrm!', soundKey: 'vehicle_motorcycle'},
      {image: require('./assets/images/vehicles/train.png'),      name: 'Train',      sound: 'Choo!',  soundKey: 'vehicle_train'},
      {image: require('./assets/images/vehicles/truck.png'),      name: 'Truck',      sound: 'Beep!',  soundKey: 'vehicle_truck'},
      {image: require('./assets/images/vehicles/rocket.png'),     name: 'Rocket',     sound: 'Blast!', soundKey: 'vehicle_rocket'},
      {image: require('./assets/images/vehicles/helicopter.png'), name: 'Helicopter', sound: 'Whirr!', soundKey: 'vehicle_helicopter'},
    ],
  },
  {
    id: 'letters',
    label: 'Letters',
    icon: '🔤',
    color: '#9B59B6',
    bgColor: '#F3E8FB',
    items: [
      {image: require('./assets/images/letters/a.png'), name: 'A', sound: 'A!', soundKey: 'letter_a'},
      {image: require('./assets/images/letters/b.png'), name: 'B', sound: 'B!', soundKey: 'letter_b'},
      {image: require('./assets/images/letters/c.png'), name: 'C', sound: 'C!', soundKey: 'letter_c'},
      {image: require('./assets/images/letters/d.png'), name: 'D', sound: 'D!', soundKey: 'letter_d'},
      {image: require('./assets/images/letters/e.png'), name: 'E', sound: 'E!', soundKey: 'letter_e'},
      {image: require('./assets/images/letters/f.png'), name: 'F', sound: 'F!', soundKey: 'letter_f'},
      {image: require('./assets/images/letters/g.png'), name: 'G', sound: 'G!', soundKey: 'letter_g'},
      {image: require('./assets/images/letters/h.png'), name: 'H', sound: 'H!', soundKey: 'letter_h'},
      {image: require('./assets/images/letters/i.png'), name: 'I', sound: 'I!', soundKey: 'letter_i'},
      {image: require('./assets/images/letters/j.png'), name: 'J', sound: 'J!', soundKey: 'letter_j'},
    ],
  },
  {
    id: 'numbers',
    label: 'Numbers',
    icon: '🔢',
    color: '#F77F00',
    bgColor: '#FEF0E0',
    items: [
      {image: require('./assets/images/numbers/1.png'),  name: '1',  sound: 'One!',   soundKey: 'number_1'},
      {image: require('./assets/images/numbers/2.png'),  name: '2',  sound: 'Two!',   soundKey: 'number_2'},
      {image: require('./assets/images/numbers/3.png'),  name: '3',  sound: 'Three!', soundKey: 'number_3'},
      {image: require('./assets/images/numbers/4.png'),  name: '4',  sound: 'Four!',  soundKey: 'number_4'},
      {image: require('./assets/images/numbers/5.png'),  name: '5',  sound: 'Five!',  soundKey: 'number_5'},
      {image: require('./assets/images/numbers/6.png'),  name: '6',  sound: 'Six!',   soundKey: 'number_6'},
      {image: require('./assets/images/numbers/7.png'),  name: '7',  sound: 'Seven!', soundKey: 'number_7'},
      {image: require('./assets/images/numbers/8.png'),  name: '8',  sound: 'Eight!', soundKey: 'number_8'},
      {image: require('./assets/images/numbers/9.png'),  name: '9',  sound: 'Nine!',  soundKey: 'number_9'},
      {image: require('./assets/images/numbers/10.png'), name: '10', sound: 'Ten!',   soundKey: 'number_10'},
    ],
  },
];

const DECOR = ['🌟', '🌈', '🎈', '⭐', '🌸', '🎀'];
const BG_VOLUME_HOME = 0.6;
const BG_VOLUME_GAME = 0.2;

// Match burst
const BURST_COUNT = 14;
const BURST_COLORS = [
  '#F2CC8F', '#E07A5F', '#81B29A', '#5C7AEA',
  '#FF6B6B', '#FECA57', '#FF9FF3', '#54A0FF',
];

type BurstParticle = {
  translate: Animated.ValueXY;
  opacity: Animated.Value;
  scale: Animated.Value;
  angle: number;
  color: string;
  size: number;
  isCircle: boolean;
  duration: number;
};

// Confetti
const CONFETTI_COUNT = 48;
const CONFETTI_COLORS = [
  '#F77F00', '#E07A5F', '#81B29A', '#F2CC8F',
  '#5C7AEA', '#9B59B6', '#FF6B6B', '#48DBFB',
  '#FECA57', '#1DD1A1', '#FF9FF3', '#54A0FF',
];

type Particle = {
  translateY: Animated.Value;
  translateX: Animated.Value;
  rotate: Animated.Value;
  opacity: Animated.Value;
  xPct: number;
  color: string;
  w: number;
  h: number;
  duration: number;
  drift: number;
  isCircle: boolean;
};

// ─── MatchBurst ───────────────────────────────────────────────────────────────

function MatchBurst({cardSize, isMatched}: {cardSize: number; isMatched: boolean}) {
  const wasMatched = useRef(false);
  const particles = useRef<BurstParticle[]>([]).current;

  if (particles.length === 0) {
    for (let i = 0; i < BURST_COUNT; i++) {
      particles.push({
        translate: new Animated.ValueXY({x: 0, y: 0}),
        opacity: new Animated.Value(0),
        scale: new Animated.Value(0),
        angle: (i / BURST_COUNT) * Math.PI * 2,
        color: BURST_COLORS[i % BURST_COLORS.length],
        size: 5 + (i % 3) * 3,
        isCircle: i % 3 !== 0,
        duration: 380 + (i % 4) * 60,
      });
    }
  }

  const radius = cardSize * 0.33;

  useEffect(() => {
    if (isMatched && !wasMatched.current) {
      wasMatched.current = true;
      Animated.parallel(
        particles.map(p =>
          Animated.parallel([
            Animated.timing(p.translate, {
              toValue: {
                x: Math.cos(p.angle) * radius,
                y: Math.sin(p.angle) * radius,
              },
              duration: p.duration,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
            Animated.sequence([
              Animated.timing(p.scale, {toValue: 1, duration: 90, useNativeDriver: true}),
              Animated.timing(p.opacity, {toValue: 1, duration: 80, useNativeDriver: true}),
              Animated.delay(p.duration - 240),
              Animated.parallel([
                Animated.timing(p.opacity, {toValue: 0, duration: 200, useNativeDriver: true}),
                Animated.timing(p.scale, {toValue: 0.3, duration: 200, useNativeDriver: true}),
              ]),
            ]),
          ]),
        ),
      ).start();
    } else if (!isMatched) {
      wasMatched.current = false;
      particles.forEach(p => {
        p.translate.setValue({x: 0, y: 0});
        p.opacity.setValue(0);
        p.scale.setValue(0);
      });
    }
  }, [isMatched, radius, particles]);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {particles.map((p, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            left: cardSize / 2 - p.size / 2,
            top: cardSize / 2 - p.size / 2,
            width: p.size,
            height: p.isCircle ? p.size : p.size * 0.55,
            backgroundColor: p.color,
            borderRadius: p.isCircle ? p.size / 2 : 2,
            opacity: p.opacity,
            transform: [
              {translateX: p.translate.x},
              {translateY: p.translate.y},
              {scale: p.scale},
            ],
          }}
        />
      ))}
    </View>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const shuffleCards = (cards: Card[]) =>
  [...cards]
    .map(card => ({card, sort: Math.random()}))
    .sort((a, b) => a.sort - b.sort)
    .map(({card}) => card);

const createDeck = (layout: GridOption, items: CardItem[]): Card[] => {
  const pairCount = (layout.rows * layout.columns) / 2;
  const selectedItems = [...items]
    .map(item => ({item, sort: Math.random()}))
    .sort((a, b) => a.sort - b.sort)
    .slice(0, pairCount)
    .map(({item}) => item);

  const pairs = selectedItems.flatMap((item, i) => [
    {...item, id: `${item.name}-a`, pairId: `${item.name}-${i}`},
    {...item, id: `${item.name}-b`, pairId: `${item.name}-${i}`},
  ]);
  return shuffleCards(pairs);
};

// ─── Confetti ─────────────────────────────────────────────────────────────────

function Confetti({visible}: {visible: boolean}) {
  const {width: W, height: H} = useWindowDimensions();
  const particles = useRef<Particle[]>([]).current;

  if (particles.length === 0) {
    for (let i = 0; i < CONFETTI_COUNT; i++) {
      particles.push({
        translateY: new Animated.Value(-20),
        translateX: new Animated.Value(0),
        rotate: new Animated.Value(0),
        opacity: new Animated.Value(1),
        xPct: Math.random(),
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        w: 9 + Math.random() * 11,
        h: 6 + Math.random() * 9,
        duration: 2400 + Math.random() * 2800,
        drift: (Math.random() - 0.5) * 140,
        isCircle: Math.random() > 0.55,
      });
    }
  }

  useEffect(() => {
    if (!visible) {
      particles.forEach(p => {
        p.translateY.setValue(-20);
        p.translateX.setValue(0);
        p.rotate.setValue(0);
        p.opacity.setValue(1);
      });
      return;
    }

    Animated.parallel(
      particles.map(p =>
        Animated.parallel([
          Animated.timing(p.translateY, {
            toValue: H + 40,
            duration: p.duration,
            useNativeDriver: true,
          }),
          Animated.timing(p.translateX, {
            toValue: p.drift,
            duration: p.duration,
            useNativeDriver: true,
          }),
          Animated.timing(p.rotate, {
            toValue: 720,
            duration: p.duration,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.delay(p.duration * 0.65),
            Animated.timing(p.opacity, {
              toValue: 0,
              duration: p.duration * 0.35,
              useNativeDriver: true,
            }),
          ]),
        ]),
      ),
    ).start();
  }, [visible, H, particles]);

  if (!visible) {
    return null;
  }

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles.map((p, i) => {
        const rot = p.rotate.interpolate({
          inputRange: [0, 720],
          outputRange: ['0deg', '720deg'],
        });
        return (
          <Animated.View
            key={i}
            style={{
              position: 'absolute',
              left: p.xPct * W,
              top: 0,
              width: p.w,
              height: p.isCircle ? p.w : p.h,
              backgroundColor: p.color,
              borderRadius: p.isCircle ? p.w / 2 : 3,
              opacity: p.opacity,
              transform: [
                {translateY: p.translateY},
                {translateX: p.translateX},
                {rotate: rot},
              ],
            }}
          />
        );
      })}
    </View>
  );
}

// ─── PreviewCard ──────────────────────────────────────────────────────────────

type PreviewCardProps = {
  item: CardItem;
  flip: Animated.Value;
  theme: CardBackTheme;
};

function PreviewCard({item, flip, theme}: Readonly<PreviewCardProps>) {
  const scaleX = flip.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0.02, 1],
  });
  const backOpacity = flip.interpolate({
    inputRange: [0, 0.44, 0.56, 1],
    outputRange: [1, 1, 0, 0],
  });
  const frontOpacity = flip.interpolate({
    inputRange: [0, 0.44, 0.56, 1],
    outputRange: [0, 0, 1, 1],
  });

  return (
    <View style={styles.previewCardWrapper}>
      <Animated.View style={[styles.previewCardInner, {transform: [{scaleX}]}]}>
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            styles.previewCardBack,
            {backgroundColor: theme.bgColor, opacity: backOpacity},
          ]}>
          <Text style={styles.previewCardBackText}>{theme.symbol}</Text>
        </Animated.View>
        <Animated.View
          style={[StyleSheet.absoluteFill, styles.previewCardFront, {opacity: frontOpacity}]}>
          <Image source={item.image} style={styles.previewCardImage} resizeMode="contain" />
          <View style={styles.previewCardLabel}>
            <Text style={styles.previewCardLabelText} numberOfLines={1}>
              {item.name}
            </Text>
          </View>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

// ─── CategoryPreview ──────────────────────────────────────────────────────────

function CategoryPreview({
  category,
  theme,
}: Readonly<{category: GameCategory; theme: CardBackTheme}>) {
  const flip0 = useRef(new Animated.Value(0)).current;
  const flip1 = useRef(new Animated.Value(0)).current;
  const flip2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    flip0.setValue(0);
    flip1.setValue(0);
    flip2.setValue(0);

    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(500),
        Animated.timing(flip0, {toValue: 1, duration: 380, useNativeDriver: true}),
        Animated.delay(280),
        Animated.timing(flip1, {toValue: 1, duration: 380, useNativeDriver: true}),
        Animated.delay(280),
        Animated.timing(flip2, {toValue: 1, duration: 380, useNativeDriver: true}),
        Animated.delay(1100),
        Animated.parallel([
          Animated.timing(flip0, {toValue: 0, duration: 280, useNativeDriver: true}),
          Animated.timing(flip1, {toValue: 0, duration: 280, useNativeDriver: true}),
          Animated.timing(flip2, {toValue: 0, duration: 280, useNativeDriver: true}),
        ]),
        Animated.delay(350),
      ]),
    );

    loop.start();
    return () => loop.stop();
  }, [category.id, flip0, flip1, flip2]);

  const [s0, s1, s2] = category.items;

  return (
    <View style={styles.categoryPreviewRow}>
      <PreviewCard item={s0} flip={flip0} theme={theme} />
      <PreviewCard item={s1} flip={flip1} theme={theme} />
      <PreviewCard item={s2} flip={flip2} theme={theme} />
    </View>
  );
}

// ─── CustomizeScreen ──────────────────────────────────────────────────────────

type CustomizeScreenProps = {
  currentCategory: GameCategory;
  currentTheme: CardBackTheme;
  onBack: (category: GameCategory, theme: CardBackTheme) => void;
  onPlay: (category: GameCategory, theme: CardBackTheme) => void;
};

function CustomizeScreen({
  currentCategory,
  currentTheme,
  onBack,
  onPlay,
}: Readonly<CustomizeScreenProps>) {
  const [cat, setCat] = useState<GameCategory>(currentCategory);
  const [theme, setTheme] = useState<CardBackTheme>(currentTheme);

  return (
    <View style={styles.categoryScreen}>
      <View style={styles.categoryHeader}>
        <Pressable
          accessibilityRole="button"
          onPress={() => onBack(cat, theme)}
          style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </Pressable>
        <Text style={styles.categoryHeaderTitle}>Customize</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        contentContainerStyle={styles.categoryScrollContent}
        showsVerticalScrollIndicator={false}>

        {/* ── Game Type section ── */}
        <View style={styles.customizeSection}>
          <Text style={styles.customizeSectionTitle}>Game Type</Text>
          <View style={styles.categoryGrid}>
            {CATEGORIES.map(c => {
              const isSelected = cat.id === c.id;
              return (
                <Pressable
                  accessibilityRole="button"
                  key={c.id}
                  onPress={() => setCat(c)}
                  style={[
                    styles.categoryOption,
                    {backgroundColor: isSelected ? c.color : c.bgColor},
                  ]}>
                  <Text style={styles.categoryOptionIcon}>{c.icon}</Text>
                  <Text
                    style={[
                      styles.categoryOptionLabel,
                      {color: isSelected ? '#FFFFFF' : '#3D405B'},
                    ]}>
                    {c.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* ── Card Back section ── */}
        <View style={styles.customizeSection}>
          <Text style={styles.customizeSectionTitle}>Card Back</Text>
          <View style={styles.themeGrid}>
            {CARD_BACK_THEMES.map(t => {
              const isSelected = theme.id === t.id;
              return (
                <Pressable
                  accessibilityRole="button"
                  key={t.id}
                  onPress={() => setTheme(t)}
                  style={[
                    styles.themeOption,
                    {backgroundColor: t.bgColor},
                    isSelected && styles.themeOptionSelected,
                  ]}>
                  <Text style={styles.themeOptionSymbol}>{t.symbol}</Text>
                  <Text style={styles.themeOptionLabel}>{t.label}</Text>
                  {isSelected && <Text style={styles.themeCheckmark}>✓</Text>}
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* ── Live preview ── */}
        <View style={[styles.previewSection, {borderColor: cat.color}]}>
          <Text style={[styles.previewSectionTitle, {color: cat.color}]}>
            {cat.icon}  Preview
          </Text>
          <CategoryPreview key={cat.id} category={cat} theme={theme} />
          <Text style={styles.previewHint}>Your cards will look like this!</Text>
        </View>

        {/* ── Play button ── */}
        <Pressable
          accessibilityRole="button"
          onPress={() => onPlay(cat, theme)}
          style={[styles.categoryPlayButton, {backgroundColor: cat.color}]}>
          <Text style={styles.categoryPlayButtonText}>Play {cat.label}!</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

// ─── MemoryCard ───────────────────────────────────────────────────────────────

type MemoryCardProps = {
  card: Card;
  cardSize: number;
  columns: number;
  disabled: boolean;
  isMatched: boolean;
  isRevealed: boolean;
  isSelected: boolean;
  theme: CardBackTheme;
  onPress: () => void;
};

function MemoryCard({
  card,
  cardSize,
  columns,
  disabled,
  isMatched,
  isRevealed,
  isSelected,
  theme,
  onPress,
}: Readonly<MemoryCardProps>): React.JSX.Element {
  const flip = useRef(new Animated.Value(isRevealed ? 1 : 0)).current;
  const bounce = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(flip, {
      toValue: isRevealed ? 1 : 0,
      friction: 8,
      tension: 80,
      useNativeDriver: true,
    }).start();
  }, [flip, isRevealed]);

  useEffect(() => {
    if (!isSelected) {
      return;
    }
    Animated.sequence([
      Animated.timing(bounce, {toValue: 1.08, duration: 120, useNativeDriver: true}),
      Animated.spring(bounce, {toValue: 1, friction: 4, useNativeDriver: true}),
    ]).start();
  }, [bounce, isSelected]);

  const rotateY = flip.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '360deg'],
  });

  return (
    <Pressable
      accessibilityLabel={isRevealed ? `${card.name}, ${card.sound}` : 'Hidden card'}
      accessibilityRole="button"
      disabled={disabled || isRevealed}
      onPress={onPress}
      style={[styles.cardWrapper, {height: cardSize, width: cardSize}]}>
      <Animated.View
        style={[
          styles.card,
          columns === 2 && styles.largeCard,
          columns === 4 && styles.smallCard,
          !isRevealed && {
            backgroundColor: theme.bgColor,
            borderColor: theme.borderColor,
          },
          isSelected && styles.cardSelected,
          isMatched && styles.cardMatched,
          isRevealed && styles.cardRevealed,
          {transform: [{rotateY}, {scale: bounce}]},
        ]}>
        {isRevealed ? (
          <>
            <View
              style={[
                styles.cardImageFrame,
                columns === 4 && styles.cardImageFrameCompact,
              ]}>
              <Image source={card.image} style={styles.cardImage} resizeMode="contain" />
            </View>
            {columns === 4 ? (
              isMatched ? (
                <View style={styles.smallMatchedBadge}>
                  <Text style={styles.smallMatchedBadgeText}>✓</Text>
                </View>
              ) : null
            ) : (
              <View
                style={[
                  styles.cardTitleOverlay,
                  isMatched && styles.cardTitleOverlayMatched,
                ]}>
                <Text style={styles.cardTitleText}>
                  {isMatched ? `✓ ${card.name}` : card.name}
                </Text>
              </View>
            )}
          </>
        ) : (
          <Text style={[styles.cardBack, columns === 4 && styles.smallCardBack]}>
            {theme.symbol}
          </Text>
        )}
      </Animated.View>

      <MatchBurst cardSize={cardSize} isMatched={isMatched} />
    </Pressable>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────

function App(): React.JSX.Element {
  const {height: windowHeight, width: windowWidth} = useWindowDimensions();
  const [screen, setScreen] = useState<Screen>('home');
  const [selectedCategory, setSelectedCategory] = useState<GameCategory>(CATEGORIES[0]);
  const [selectedLayout, setSelectedLayout] = useState<GridOption>(GRID_OPTIONS[0]);
  const [selectedTheme, setSelectedTheme] = useState<CardBackTheme>(CARD_BACK_THEMES[0]);
  const [cards, setCards] = useState<Card[]>(() =>
    createDeck(GRID_OPTIONS[0], CATEGORIES[0].items),
  );
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [matchedIds, setMatchedIds] = useState<string[]>([]);
  const [attempts, setAttempts] = useState(0);
  const [message, setMessage] = useState('Tap play to start!');
  const [soundText, setSoundText] = useState('Ready?');
  const [resultPopup, setResultPopup] = useState<ResultPopup | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const playScale = useRef(new Animated.Value(1)).current;
  const feedbackScale = useRef(new Animated.Value(1)).current;
  const soundsRef = useRef<LoadedSounds>({});
  const backgroundStartedRef = useRef(false);
  const isMutedRef = useRef(false);
  const screenRef = useRef<Screen>('home');
  const appStateRef = useRef(AppState.currentState);
  const matchedIdsRef = useRef<string[]>([]);

  const selectedCards = useMemo(
    () =>
      selectedIds
        .map(id => cards.find(card => card.id === id))
        .filter((card): card is Card => Boolean(card)),
    [cards, selectedIds],
  );

  const pairCount = cards.length / 2;
  const matchedPairCount = matchedIds.length / 2;
  const hasWon = matchedIds.length === cards.length && cards.length > 0;
  const maxAttempts = cards.length * 2;
  const boardGap = selectedLayout.columns === 4 ? 6 : 10;
  const availableBoardWidth = windowWidth - 36;
  const reservedGameHeight = selectedLayout.columns === 4 ? 210 : 240;
  const availableBoardHeight = Math.max(220, windowHeight - reservedGameHeight);
  const cardSize = Math.floor(
    Math.min(
      (availableBoardWidth - boardGap * (selectedLayout.columns - 1)) / selectedLayout.columns,
      (availableBoardHeight - boardGap * (selectedLayout.rows - 1)) / selectedLayout.rows,
    ),
  );

  // ── Sound helpers ──────────────────────────────────────────────────────────

  const playSound = (name: SoundName) => {
    if (isMutedRef.current) {
      return;
    }
    const sound = soundsRef.current[name];
    if (!sound?.isLoaded()) {
      return;
    }
    sound.stop(() => {
      sound.setCurrentTime(0);
      sound.play();
    });
  };

  const playItemSound = (soundKey: string) => {
    if (isMutedRef.current) {
      return;
    }
    const s = new Sound(`${soundKey}.wav`, Sound.MAIN_BUNDLE, (err: Error | null) => {
      if (err) {
        return;
      }
      s.setVolume(0.88);
      s.play(() => s.release());
    });
  };

  const startBackgroundSound = (volume = BG_VOLUME_GAME) => {
    backgroundStartedRef.current = true;
    if (isMutedRef.current) {
      return;
    }
    const bg = soundsRef.current.background;
    if (!bg?.isLoaded()) {
      return;
    }
    bg.setNumberOfLoops(-1);
    bg.setVolume(volume);
    bg.play();
  };

  const setBackgroundVolume = (volume: number) => {
    if (isMutedRef.current) {
      return;
    }
    soundsRef.current.background?.setVolume(volume);
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    isMutedRef.current = nextMuted;
    setIsMuted(nextMuted);
    const bg = soundsRef.current.background;
    if (!bg?.isLoaded()) {
      return;
    }
    const resumeVol = screenRef.current === 'home' ? BG_VOLUME_HOME : BG_VOLUME_GAME;
    if (nextMuted) {
      bg.pause();
    } else if (backgroundStartedRef.current) {
      bg.setVolume(resumeVol);
      bg.play();
    }
  };

  // ── Effects ────────────────────────────────────────────────────────────────

  useEffect(() => {
    screenRef.current = screen;
  }, [screen]);

  useEffect(() => {
    matchedIdsRef.current = matchedIds;
  }, [matchedIds]);

  useEffect(() => {
    Sound.setCategory('Playback', true);
    const loadedSounds: LoadedSounds = {};
    soundsRef.current = loadedSounds;

    (Object.keys(SOUND_FILES) as SoundName[]).forEach(name => {
      const sound = new Sound(SOUND_FILES[name], Sound.MAIN_BUNDLE, error => {
        const loaded = loadedSounds[name];
        if (error || !loaded) {
          return;
        }
        if (name === 'background') {
          backgroundStartedRef.current = true;
          loaded.setNumberOfLoops(-1);
          loaded.setVolume(
            screenRef.current === 'home' ? BG_VOLUME_HOME : BG_VOLUME_GAME,
          );
          if (appStateRef.current === 'active' && !isMutedRef.current) {
            loaded.play();
          }
        } else {
          loaded.setVolume(SOUND_VOLUMES[name]);
        }
      });

      loadedSounds[name] = sound;
      if (name === 'background') {
        sound.setNumberOfLoops(-1);
        sound.setVolume(BG_VOLUME_HOME);
        backgroundStartedRef.current = true;
        if (sound.isLoaded() && AppState.currentState === 'active') {
          sound.play();
        }
      } else {
        sound.setVolume(SOUND_VOLUMES[name]);
      }
    });

    return () => {
      Object.values(soundsRef.current).forEach(s => {
        s?.stop();
        s?.release();
      });
      soundsRef.current = {};
    };
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener('change', nextState => {
      appStateRef.current = nextState;
      const bg = soundsRef.current.background;
      if (!bg?.isLoaded()) {
        return;
      }
      if (nextState === 'active') {
        if (backgroundStartedRef.current && !isMutedRef.current) {
          const vol = screenRef.current === 'home' ? BG_VOLUME_HOME : BG_VOLUME_GAME;
          bg.setVolume(vol);
          bg.play();
        }
        return;
      }
      bg.pause();
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (screen !== 'home') {
      playScale.stopAnimation();
      playScale.setValue(1);
      return;
    }
    playScale.setValue(1);
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(playScale, {
          toValue: 1.12,
          duration: 850,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(playScale, {
          toValue: 1,
          duration: 850,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [playScale, screen]);

  useEffect(() => {
    Animated.sequence([
      Animated.timing(feedbackScale, {toValue: 1.1, duration: 130, useNativeDriver: true}),
      Animated.spring(feedbackScale, {toValue: 1, friction: 5, useNativeDriver: true}),
    ]).start();
  }, [feedbackScale, message]);

  useEffect(() => {
    if (selectedCards.length !== 2) {
      return;
    }
    setIsChecking(true);
    const [first, second] = selectedCards;
    const isMatch = first.pairId === second.pairId;

    const timeout = setTimeout(() => {
      const nextAttempts = attempts + 1;
      setAttempts(nextAttempts);

      const isLastAttempt = nextAttempts >= maxAttempts;

      if (isMatch) {
        const isWinningMatch = matchedIdsRef.current.length + 2 === cards.length;
        setMessage('Great match! 🎉');
        setSoundText(`${first.sound} ${second.sound}`);
        Vibration.vibrate(isWinningMatch ? [0, 80, 50, 100, 50, 120] : [0, 80]);
        playSound(isWinningMatch ? 'win' : 'success');
        setMatchedIds(current => {
          const next = [...current, first.id, second.id];
          if (next.length === cards.length) {
            setResultPopup({
              emoji: '🏆',
              title: 'You won!',
              message: `Amazing! All ${pairCount} pairs in ${nextAttempts} tries!`,
              primaryActionLabel: 'Play Again',
            });
          } else if (isLastAttempt) {
            setResultPopup({
              emoji: '😅',
              title: 'Almost!',
              message: `You used all ${maxAttempts} tries. Want to retry?`,
              primaryActionLabel: 'Retry',
            });
          }
          return next;
        });
      } else {
        setMessage('Keep trying! 💪');
        setSoundText('Boing!');
        Vibration.vibrate(isLastAttempt ? [0, 80, 50, 80, 50, 80] : [0, 60, 50, 60]);
        playSound(isLastAttempt ? 'lose' : 'failure');
        if (isLastAttempt) {
          setResultPopup({
            emoji: '😅',
            title: 'Almost!',
            message: `You used all ${maxAttempts} tries. Want to retry?`,
            primaryActionLabel: 'Retry',
          });
        }
      }

      setSelectedIds([]);
      setIsChecking(false);
    }, 650);

    return () => clearTimeout(timeout);
  }, [attempts, cards.length, maxAttempts, pairCount, selectedCards]);

  // ── Actions ────────────────────────────────────────────────────────────────

  const startGame = (layout = selectedLayout, cat = selectedCategory) => {
    playSound('click');
    if (backgroundStartedRef.current) {
      setBackgroundVolume(BG_VOLUME_GAME);
    } else {
      startBackgroundSound(BG_VOLUME_GAME);
    }
    setCards(createDeck(layout, cat.items));
    setSelectedIds([]);
    setMatchedIds([]);
    setAttempts(0);
    setResultPopup(null);
    setMessage(`Find the ${cat.label.toLowerCase()} pairs!`);
    setSoundText('Go!');
    setScreen('game');
  };

  const goHome = () => {
    playSound('click');
    startBackgroundSound(BG_VOLUME_HOME);
    setResultPopup(null);
    setScreen('home');
  };

  const closePopup = () => {
    playSound('click');
    if (hasWon || resultPopup?.primaryActionLabel === 'Retry') {
      startGame(selectedLayout, selectedCategory);
      return;
    }
    setResultPopup(null);
  };

  const chooseLayout = (layout: GridOption) => {
    playSound('click');
    setSelectedLayout(layout);
  };

  const handleCardPress = (card: Card) => {
    if (
      isChecking ||
      selectedIds.includes(card.id) ||
      matchedIds.includes(card.id) ||
      selectedIds.length === 2
    ) {
      return;
    }
    playItemSound(card.soundKey);
    setSoundText(card.sound);
    setSelectedIds(current => [...current, card.id]);
  };

  // ── Screens ────────────────────────────────────────────────────────────────

  const renderHome = () => (
    <ScrollView
      contentContainerStyle={styles.homeContent}
      showsVerticalScrollIndicator={false}>
      <View style={styles.decorRow}>
        {DECOR.map((emoji, i) => (
          <Text key={i} style={styles.decorEmoji}>
            {emoji}
          </Text>
        ))}
      </View>

      <Text style={styles.logo}>Memory Match</Text>
      <Text style={styles.subtitle}>Match cards and learn together!</Text>

      <Animated.View style={{transform: [{scale: playScale}]}}>
        <Pressable
          accessibilityRole="button"
          onPress={() => startGame()}
          style={[styles.playButton, {backgroundColor: selectedCategory.color}]}>
          <Text style={styles.playButtonIcon}>▶</Text>
          <Text style={styles.playButtonText}>PLAY</Text>
        </Pressable>
      </Animated.View>

      <View style={styles.settingsPanel}>
        <View style={styles.settingsHeader}>
          <Text style={styles.settingsTitle}>Settings</Text>
          <Pressable
            accessibilityRole="button"
            onPress={toggleMute}
            style={styles.muteButton}>
            <Text style={styles.muteButtonText}>{isMuted ? '🔇' : '🔊'}</Text>
          </Pressable>
        </View>

        {/* Customize row */}
        <Pressable
          accessibilityRole="button"
          onPress={() => setScreen('customize')}
          style={[styles.settingsRow, {borderColor: selectedCategory.color}]}>
          <Text style={styles.settingsRowLabel}>Customize</Text>
          <View style={styles.settingsRowRight}>
            <Text style={styles.settingsRowIcon}>{selectedCategory.icon}</Text>
            <Text style={[styles.settingsRowName, {color: selectedCategory.color}]}>
              {selectedCategory.label}
            </Text>
            <Text style={styles.settingsRowDot}> · </Text>
            <Text style={styles.settingsRowIcon}>{selectedTheme.symbol}</Text>
            <Text style={[styles.settingsRowArrow, {color: selectedCategory.color}]}>›</Text>
          </View>
        </Pressable>

        {/* Tile count */}
        <Text style={styles.settingsText}>Number of tiles</Text>
        <View style={styles.gridOptions}>
          {GRID_OPTIONS.map(layout => (
            <Pressable
              accessibilityRole="button"
              key={layout.id}
              onPress={() => chooseLayout(layout)}
              style={[
                styles.gridButton,
                selectedLayout.id === layout.id && {
                  backgroundColor: selectedCategory.color,
                },
              ]}>
              <Text
                style={[
                  styles.gridButtonText,
                  selectedLayout.id === layout.id && styles.gridButtonTextActive,
                ]}>
                {layout.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </ScrollView>
  );

  const renderGame = () => (
    <View style={styles.game}>
      <View style={styles.gameHeader}>
        <Pressable
          accessibilityRole="button"
          onPress={goHome}
          style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Home</Text>
        </Pressable>

        <View style={styles.progressPill}>
          <Text style={styles.progressText}>
            {matchedPairCount}/{pairCount} {selectedCategory.icon}
          </Text>
        </View>

        <View style={styles.headerRight}>
          <Pressable
            accessibilityRole="button"
            onPress={toggleMute}
            style={styles.muteButton}>
            <Text style={styles.muteButtonText}>{isMuted ? '🔇' : '🔊'}</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => startGame(selectedLayout, selectedCategory)}
            style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>↺</Text>
          </Pressable>
        </View>
      </View>

      <Animated.View
        style={[
          styles.feedbackBadge,
          selectedLayout.columns === 4 && styles.compactFeedbackBadge,
          {transform: [{scale: feedbackScale}]},
        ]}>
        <Text style={styles.feedbackText}>{message}</Text>
        <Text style={styles.soundText}>{soundText}</Text>
        <Text style={styles.attemptText}>
          Tries {attempts} / {maxAttempts}
        </Text>
      </Animated.View>

      <View style={[styles.board, {gap: boardGap}]}>
        {cards.map(card => {
          const isSelected = selectedIds.includes(card.id);
          const isMatched = matchedIds.includes(card.id);
          return (
            <MemoryCard
              card={card}
              cardSize={cardSize}
              columns={selectedLayout.columns}
              disabled={hasWon || Boolean(resultPopup)}
              isMatched={isMatched}
              isRevealed={isSelected || isMatched}
              isSelected={isSelected}
              key={card.id}
              theme={selectedTheme}
              onPress={() => handleCardPress(card)}
            />
          );
        })}
      </View>

      {hasWon ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => startGame(selectedLayout, selectedCategory)}
          style={[styles.winButton, {backgroundColor: selectedCategory.color}]}>
          <Text style={styles.winButtonText}>Play Again 🎉</Text>
        </Pressable>
      ) : null}

      {/* Confetti overlay — shown on win */}
      <Confetti visible={hasWon} />
    </View>
  );

  const renderResultPopup = () => {
    if (!resultPopup) {
      return null;
    }
    return (
      <Modal animationType="fade" transparent visible>
        <View style={styles.modalOverlay}>
          <Animated.View
            style={[styles.resultPopup, {transform: [{scale: feedbackScale}]}]}>
            <Text style={styles.popupEmoji}>{resultPopup.emoji}</Text>
            <Text style={styles.popupTitle}>{resultPopup.title}</Text>
            <Text style={styles.popupMessage}>{resultPopup.message}</Text>
            <Pressable
              accessibilityRole="button"
              onPress={closePopup}
              style={[
                styles.popupPrimaryButton,
                {backgroundColor: selectedCategory.color},
              ]}>
              <Text style={styles.popupPrimaryButtonText}>
                {resultPopup.primaryActionLabel}
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={goHome}
              style={styles.popupSecondaryButton}>
              <Text style={styles.popupSecondaryButtonText}>Home</Text>
            </Pressable>
          </Animated.View>
        </View>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FDF0D5" />
      <View style={styles.container}>
        {screen === 'home' && renderHome()}
        {screen === 'customize' && (
          <CustomizeScreen
            currentCategory={selectedCategory}
            currentTheme={selectedTheme}
            onBack={(newCat, newTheme) => {
              setSelectedCategory(newCat);
              setSelectedTheme(newTheme);
              setScreen('home');
            }}
            onPlay={(newCat, newTheme) => {
              setSelectedCategory(newCat);
              setSelectedTheme(newTheme);
              startGame(selectedLayout, newCat);
            }}
          />
        )}
        {screen === 'game' && renderGame()}
        {renderResultPopup()}
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FDF0D5',
  },
  container: {
    flex: 1,
    backgroundColor: '#FDF0D5',
  },

  // ── Home ──
  homeContent: {
    alignItems: 'center',
    paddingBottom: 32,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  decorRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  decorEmoji: {
    fontSize: 22,
  },
  logo: {
    color: '#3D405B',
    fontSize: 38,
    fontWeight: '900',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  subtitle: {
    color: '#5C677D',
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 36,
    marginTop: 10,
    textAlign: 'center',
  },
  playButton: {
    alignItems: 'center',
    borderColor: '#FFFFFF',
    borderRadius: 999,
    borderWidth: 8,
    elevation: 8,
    height: 160,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 10},
    shadowOpacity: 0.22,
    shadowRadius: 14,
    width: 160,
  },
  playButtonIcon: {
    color: '#FFFFFF',
    fontSize: 40,
    fontWeight: '900',
    marginLeft: 6,
  },
  playButtonText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    marginTop: 4,
  },
  settingsPanel: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    marginTop: 36,
    padding: 20,
    width: '100%',
  },
  settingsHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  settingsTitle: {
    color: '#3D405B',
    fontSize: 22,
    fontWeight: '900',
  },
  settingsRow: {
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  settingsRowLabel: {
    color: '#5C677D',
    fontSize: 15,
    fontWeight: '700',
  },
  settingsRowRight: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  settingsRowIcon: {
    fontSize: 20,
  },
  settingsRowName: {
    fontSize: 16,
    fontWeight: '900',
  },
  settingsRowArrow: {
    fontSize: 22,
    fontWeight: '900',
  },
  settingsRowDot: {
    color: '#5C677D',
    fontSize: 16,
    fontWeight: '700',
  },
  settingsText: {
    color: '#5C677D',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
    marginTop: 2,
  },
  gridOptions: {
    flexDirection: 'row',
    gap: 10,
  },
  gridButton: {
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    borderRadius: 18,
    flex: 1,
    paddingVertical: 14,
  },
  gridButtonText: {
    color: '#3D405B',
    fontSize: 15,
    fontWeight: '900',
  },
  gridButtonTextActive: {
    color: '#FFFFFF',
  },

  // ── Category / Theme screens ──
  categoryScreen: {
    backgroundColor: '#FDF0D5',
    flex: 1,
  },
  categoryHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  backButton: {
    alignItems: 'center',
    backgroundColor: '#3D405B',
    borderRadius: 16,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
  },
  categoryHeaderTitle: {
    color: '#3D405B',
    fontSize: 22,
    fontWeight: '900',
  },
  categoryScrollContent: {
    paddingHorizontal: 18,
    paddingBottom: 32,
    paddingTop: 8,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
    marginBottom: 20,
  },
  categoryOption: {
    alignItems: 'center',
    borderRadius: 22,
    elevation: 2,
    height: 96,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    width: '30%',
  },
  categoryOptionIcon: {
    fontSize: 34,
    marginBottom: 4,
  },
  categoryOptionLabel: {
    fontSize: 13,
    fontWeight: '900',
  },

  // ── Customize screen sections ──
  customizeSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    marginBottom: 14,
    padding: 16,
  },
  customizeSectionTitle: {
    color: '#3D405B',
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  // ── Theme screen specific ──
  themeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
    marginBottom: 20,
  },
  themeOption: {
    alignItems: 'center',
    borderRadius: 22,
    elevation: 2,
    height: 96,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.15,
    shadowRadius: 4,
    width: '30%',
    position: 'relative',
  },
  themeOptionSelected: {
    borderWidth: 3,
    borderColor: '#FFD700',
  },
  themeOptionSymbol: {
    fontSize: 34,
    marginBottom: 4,
  },
  themeOptionLabel: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  themeCheckmark: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: '900',
    position: 'absolute',
    top: 6,
    right: 10,
  },
  themePreviewCard: {
    alignItems: 'center',
    borderRadius: 26,
    borderWidth: 5,
    elevation: 6,
    height: 140,
    justifyContent: 'center',
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.22,
    shadowRadius: 12,
    width: 110,
  },
  themePreviewSymbol: {
    fontSize: 52,
  },

  // ── Preview section (shared) ──
  previewSection: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    borderWidth: 3,
    marginBottom: 20,
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  previewSectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 16,
  },
  categoryPreviewRow: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
  },
  previewCardWrapper: {
    height: 110,
    width: 88,
  },
  previewCardInner: {
    borderRadius: 20,
    flex: 1,
    overflow: 'hidden',
  },
  previewCardBack: {
    alignItems: 'center',
    borderRadius: 20,
    justifyContent: 'center',
  },
  previewCardBackText: {
    fontSize: 34,
  },
  previewCardFront: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  previewCardImage: {
    height: 72,
    width: 72,
  },
  previewCardLabel: {
    alignItems: 'center',
    backgroundColor: 'rgba(61,64,91,0.8)',
    bottom: 0,
    left: 0,
    paddingVertical: 3,
    position: 'absolute',
    right: 0,
  },
  previewCardLabelText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },
  previewHint: {
    color: '#5C677D',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 12,
    textAlign: 'center',
  },
  categoryPlayButton: {
    alignItems: 'center',
    borderRadius: 26,
    elevation: 4,
    paddingVertical: 18,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 8,
    width: '100%',
  },
  categoryPlayButtonText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
  },

  // ── Shared ──
  muteButton: {
    backgroundColor: '#EEF2FF',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  muteButtonText: {
    fontSize: 20,
  },

  // ── Game ──
  game: {
    flex: 1,
    padding: 18,
  },
  gameHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressPill: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  progressText: {
    color: '#3D405B',
    fontSize: 14,
    fontWeight: '900',
  },
  headerRight: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  secondaryButton: {
    backgroundColor: '#3D405B',
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 11,
  },
  secondaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  feedbackBadge: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    marginBottom: 18,
    marginTop: 18,
    paddingHorizontal: 22,
    paddingVertical: 14,
  },
  compactFeedbackBadge: {
    marginBottom: 10,
    marginTop: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  feedbackText: {
    color: '#3D405B',
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
  },
  soundText: {
    color: '#E07A5F',
    fontSize: 18,
    fontWeight: '900',
    marginTop: 4,
  },
  attemptText: {
    color: '#5C677D',
    fontSize: 14,
    fontWeight: '800',
    marginTop: 6,
  },
  board: {
    alignContent: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },

  // ── Cards ──
  cardWrapper: {
    flexGrow: 0,
    flexShrink: 0,
  },
  card: {
    alignItems: 'center',
    backgroundColor: '#3D405B',
    borderColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 4,
    elevation: 4,
    flex: 1,
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: {width: 0, height: 5},
    shadowOpacity: 0.16,
    shadowRadius: 10,
  },
  largeCard: {
    borderRadius: 30,
    borderWidth: 5,
  },
  smallCard: {
    borderRadius: 18,
    borderWidth: 3,
  },
  cardSelected: {
    borderColor: '#F77F00',
  },
  cardMatched: {
    borderColor: '#81B29A',
    borderWidth: 4,
  },
  cardRevealed: {
    backgroundColor: '#FFFFFF',
  },
  cardBack: {
    fontSize: 38,
  },
  smallCardBack: {
    fontSize: 24,
  },
  cardImageFrame: {
    alignItems: 'center',
    aspectRatio: 1,
    justifyContent: 'center',
    width: '78%',
  },
  cardImageFrameCompact: {
    width: '84%',
  },
  cardImage: {
    height: '100%',
    width: '100%',
  },
  smallMatchedBadge: {
    alignItems: 'center',
    backgroundColor: '#81B29A',
    borderRadius: 999,
    height: 20,
    justifyContent: 'center',
    position: 'absolute',
    right: 3,
    top: 3,
    width: 20,
  },
  smallMatchedBadgeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  cardTitleOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(61, 64, 91, 0.82)',
    bottom: 0,
    left: 0,
    paddingVertical: 5,
    position: 'absolute',
    right: 0,
  },
  cardTitleOverlayMatched: {
    backgroundColor: 'rgba(129, 178, 154, 0.9)',
  },
  cardTitleText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    textAlign: 'center',
  },
  winButton: {
    alignItems: 'center',
    alignSelf: 'center',
    borderRadius: 22,
    marginTop: 20,
    paddingHorizontal: 34,
    paddingVertical: 16,
  },
  winButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
  },

  // ── Modal ──
  modalOverlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(61, 64, 91, 0.45)',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  resultPopup: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#F2CC8F',
    borderRadius: 34,
    borderWidth: 5,
    maxWidth: 360,
    padding: 24,
    shadowColor: '#000000',
    shadowOffset: {width: 0, height: 10},
    shadowOpacity: 0.22,
    shadowRadius: 18,
    width: '100%',
  },
  popupEmoji: {
    fontSize: 56,
    marginBottom: 8,
  },
  popupTitle: {
    color: '#3D405B',
    fontSize: 30,
    fontWeight: '900',
    textAlign: 'center',
  },
  popupMessage: {
    color: '#5C677D',
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 26,
    marginTop: 10,
    textAlign: 'center',
  },
  popupPrimaryButton: {
    alignItems: 'center',
    borderRadius: 22,
    marginTop: 22,
    paddingHorizontal: 28,
    paddingVertical: 14,
    width: '100%',
  },
  popupPrimaryButtonText: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '900',
  },
  popupSecondaryButton: {
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    borderRadius: 18,
    marginTop: 12,
    paddingVertical: 13,
    width: '100%',
  },
  popupSecondaryButtonText: {
    color: '#3D405B',
    fontSize: 17,
    fontWeight: '900',
  },
});

export default App;
