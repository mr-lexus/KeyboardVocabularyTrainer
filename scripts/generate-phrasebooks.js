import fs from 'fs';
import translate from 'google-translate-api-x';

const TOPICS = {
  'Travel & Transport': {
    keywords: ['airport', 'ticket', 'train', 'bus', 'flight', 'taxi', 'luggage', 'passport', 'station', 'travel', 'trip', 'tourist', 'map', 'subway', 'depart', 'arrive'],
    emoji: '✈️'
  },
  'Hotel & Accommodation': {
    keywords: ['hotel', 'room', 'book', 'reservation', 'check in', 'check out', 'bed', 'towel', 'key', 'reception', 'stay'],
    emoji: '🏨'
  },
  'Restaurant & Food': {
    keywords: ['restaurant', 'menu', 'food', 'eat', 'drink', 'water', 'waiter', 'bill', 'delicious', 'hungry', 'thirsty', 'coffee', 'tea', 'breakfast', 'lunch', 'dinner', 'table', 'order', 'soup', 'meat'],
    emoji: '🍽️'
  },
  'Shopping & Money': {
    keywords: ['buy', 'shop', 'price', 'cost', 'expensive', 'cheap', 'store', 'pay', 'cash', 'credit card', 'size', 'discount', 'sale', 'money', 'change', 'receipt'],
    emoji: '🛍️'
  },
  'Emergency & Health': {
    keywords: ['help', 'police', 'doctor', 'hospital', 'emergency', 'hurt', 'pain', 'ambulance', 'lost', 'stolen', 'sick', 'medicine', 'danger', 'accident', 'pharmacy', 'dentist', 'ill', 'fever', 'headache'],
    emoji: '🚑'
  },
  'Small Talk & Basics': {
    keywords: ['hello', 'how are you', 'weather', 'nice to meet', 'where are you from', 'good morning', 'thank you', 'please', 'excuse me', 'sorry', 'goodbye', 'friend', 'name', 'speak english', 'understand', 'welcome', 'congratulations', 'good luck'],
    emoji: '💬'
  },
  'Work & Business': {
    keywords: ['work', 'job', 'office', 'boss', 'meeting', 'company', 'business', 'manager', 'colleague', 'salary', 'interview', 'career', 'project', 'client', 'contract', 'presentation', 'email'],
    emoji: '💼'
  },
  'Education & Study': {
    keywords: ['school', 'university', 'college', 'student', 'teacher', 'class', 'exam', 'test', 'study', 'learn', 'homework', 'library', 'book', 'course', 'degree', 'lesson'],
    emoji: '🎓'
  },
  'Hobbies & Free Time': {
    keywords: ['hobby', 'free time', 'sport', 'music', 'movie', 'film', 'read', 'play', 'game', 'dance', 'sing', 'paint', 'draw', 'guitar', 'piano', 'swimming', 'football', 'basketball', 'tennis', 'gym', 'run'],
    emoji: '🎨'
  },
  'Family & Relationships': {
    keywords: ['family', 'mother', 'father', 'brother', 'sister', 'son', 'daughter', 'husband', 'wife', 'parents', 'children', 'grandparents', 'uncle', 'aunt', 'cousin', 'marry', 'divorce', 'relationship', 'love'],
    emoji: '👨‍👩‍👧‍👦'
  },
  'Home & Living': {
    keywords: ['house', 'apartment', 'home', 'room', 'kitchen', 'bathroom', 'bedroom', 'living room', 'garden', 'furniture', 'rent', 'move', 'clean', 'wash', 'cook'],
    emoji: '🏠'
  },
  'Nature & Weather': {
    keywords: ['weather', 'sun', 'rain', 'snow', 'wind', 'cloud', 'hot', 'cold', 'warm', 'cool', 'nature', 'tree', 'flower', 'animal', 'dog', 'cat', 'bird', 'sea', 'ocean', 'mountain', 'forest'],
    emoji: '🌤️'
  },
  'Technology & Internet': {
    keywords: ['computer', 'laptop', 'phone', 'smartphone', 'internet', 'wifi', 'password', 'email', 'website', 'app', 'download', 'screen', 'keyboard', 'mouse', 'battery', 'charge'],
    emoji: '💻'
  },
  'Time & Dates': {
    keywords: ['time', 'hour', 'minute', 'second', 'day', 'week', 'month', 'year', 'today', 'tomorrow', 'yesterday', 'morning', 'afternoon', 'evening', 'night', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday', 'january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december', 'spring', 'summer', 'autumn', 'winter'],
    emoji: '🕒'
  },
  'Feelings & Emotions': {
    keywords: ['happy', 'sad', 'angry', 'scared', 'tired', 'bored', 'excited', 'nervous', 'surprised', 'feel', 'emotion', 'cry', 'laugh', 'smile'],
    emoji: '😊'
  },
  'Arts & Culture': {
    keywords: ['art', 'museum', 'gallery', 'painting', 'sculpture', 'theatre', 'concert', 'festival', 'culture', 'history', 'literature', 'poetry', 'poem', 'author', 'artist', 'actor', 'actress'],
    emoji: '🎭'
  },
  'Law & Order': {
    keywords: ['law', 'lawyer', 'judge', 'court', 'prison', 'jail', 'crime', 'criminal', 'steal', 'rob', 'murder', 'legal', 'illegal', 'guilty', 'innocent', 'arrest', 'rules'],
    emoji: '⚖️'
  },
  'Science & Space': {
    keywords: ['science', 'scientist', 'physics', 'chemistry', 'biology', 'space', 'star', 'planet', 'moon', 'sun', 'earth', 'galaxy', 'universe', 'telescope', 'research', 'experiment', 'discover'],
    emoji: '🚀'
  },
  'Politics & Society': {
    keywords: ['politics', 'president', 'government', 'election', 'vote', 'law', 'society', 'citizen', 'country', 'nation', 'war', 'peace', 'freedom', 'rights', 'leader', 'minister'],
    emoji: '🏛️'
  },
  'Clothing & Fashion': {
    keywords: ['clothes', 'clothing', 'shirt', 't-shirt', 'pants', 'jeans', 'dress', 'skirt', 'shoes', 'socks', 'hat', 'coat', 'jacket', 'wear', 'put on', 'take off', 'fashion', 'style'],
    emoji: '👗'
  },
  'Body Parts': {
    keywords: ['body', 'head', 'face', 'eye', 'ear', 'nose', 'mouth', 'hair', 'neck', 'shoulder', 'arm', 'hand', 'finger', 'leg', 'foot', 'toe', 'back', 'chest', 'stomach', 'heart', 'blood'],
    emoji: '🧍'
  },
  'Colors & Shapes': {
    keywords: ['color', 'red', 'blue', 'green', 'yellow', 'black', 'white', 'black', 'orange', 'purple', 'brown', 'pink', 'gray', 'grey', 'shape', 'circle', 'square', 'triangle', 'line'],
    emoji: '🎨'
  },
  'Animals & Pets': {
    keywords: ['animal', 'pet', 'dog', 'cat', 'bird', 'fish', 'horse', 'cow', 'pig', 'sheep', 'chicken', 'mouse', 'rat', 'elephant', 'lion', 'tiger', 'bear', 'monkey', 'snake', 'spider', 'insect'],
    emoji: '🐾'
  },
  'Sports & Fitness': {
    keywords: ['sport', 'football', 'basketball', 'baseball', 'soccer', 'tennis', 'gym', 'workout', 'exercise', 'coach', 'team', 'match', 'score', 'player', 'stadium', 'champion', 'athlete', 'training'],
    emoji: '⚽️'
  },
  'Driving & Road': {
    keywords: ['car', 'drive', 'driver', 'road', 'traffic', 'highway', 'speed', 'brake', 'engine', 'tire', 'gas', 'petrol', 'parking', 'street', 'bridge', 'accident', 'license', 'vehicle'],
    emoji: '🚗'
  },
  'Finance & Banking': {
    keywords: ['bank', 'account', 'loan', 'borrow', 'lend', 'invest', 'tax', 'debt', 'interest', 'currency', 'exchange', 'wallet', 'deposit', 'withdraw', 'budget', 'economy', 'wealth', 'profit'],
    emoji: '🏦'
  },
  'Media & News': {
    keywords: ['news', 'newspaper', 'journalist', 'reporter', 'television', 'radio', 'magazine', 'article', 'broadcast', 'media', 'press', 'headline', 'interview', 'channel', 'journalism'],
    emoji: '📺'
  },
  'Environment & Ecology': {
    keywords: ['environment', 'ecology', 'pollution', 'recycle', 'climate', 'global warming', 'plastic', 'waste', 'solar', 'energy', 'protect', 'nature', 'conservation', 'sustainable', 'green'],
    emoji: '🌍'
  },
  'Communication & Post': {
    keywords: ['mail', 'letter', 'post office', 'stamp', 'package', 'envelope', 'send', 'deliver', 'parcel', 'postman', 'address', 'message', 'communicate', 'reply', 'contact'],
    emoji: '📮'
  },
  'Cooking & Recipes': {
    keywords: ['recipe', 'cook', 'bake', 'boil', 'fry', 'ingredients', 'salt', 'pepper', 'sugar', 'flour', 'oven', 'stove', 'pot', 'pan', 'knife', 'fork', 'spoon', 'chef', 'meal', 'taste'],
    emoji: '🍳'
  },
  'Geography & Places': {
    keywords: ['geography', 'country', 'city', 'town', 'village', 'island', 'lake', 'river', 'continent', 'border', 'capital', 'region', 'valley', 'map', 'location', 'place'],
    emoji: '🗺️'
  },
  'Religion & Beliefs': {
    keywords: ['religion', 'god', 'believe', 'pray', 'church', 'temple', 'faith', 'soul', 'holy', 'sacred', 'priest', 'sin', 'heaven', 'hell', 'spirit', 'spiritual', 'divine'],
    emoji: '🕊️'
  },
  'Military & War': {
    keywords: ['military', 'war', 'army', 'soldier', 'weapon', 'gun', 'fight', 'battle', 'enemy', 'attack', 'defense', 'guard', 'officer', 'general', 'navy', 'bomb', 'peace'],
    emoji: '🪖'
  },
  'Architecture & Buildings': {
    keywords: ['architecture', 'building', 'bridge', 'tower', 'castle', 'palace', 'roof', 'wall', 'floor', 'window', 'door', 'stair', 'construct', 'design', 'structure'],
    emoji: '🏛️'
  },
  'Agriculture & Farming': {
    keywords: ['farm', 'farmer', 'agriculture', 'crop', 'harvest', 'tractor', 'field', 'seed', 'plant', 'grow', 'soil', 'wheat', 'corn', 'barn', 'cattle'],
    emoji: '🌾'
  },
  'Medicine & Diseases': {
    keywords: ['disease', 'virus', 'infection', 'cancer', 'symptom', 'cure', 'treatment', 'surgery', 'operation', 'pill', 'drug', 'patient', 'clinic', 'nurse', 'blood', 'breathe'],
    emoji: '💊'
  },
  'Tools & Equipment': {
    keywords: ['tool', 'hammer', 'nail', 'screw', 'saw', 'drill', 'wrench', 'axe', 'equipment', 'machine', 'fix', 'repair', 'build', 'metal', 'wood'],
    emoji: '🛠️'
  },
  'Mathematics & Numbers': {
    keywords: ['math', 'mathematics', 'number', 'count', 'calculate', 'add', 'subtract', 'multiply', 'divide', 'equals', 'fraction', 'percentage', 'equation', 'geometry', 'algebra', 'zero', 'hundred', 'thousand'],
    emoji: '🔢'
  },
  'Space & Astronomy': {
    keywords: ['space', 'astronomy', 'astronaut', 'rocket', 'spaceship', 'satellite', 'orbit', 'gravity', 'mars', 'alien', 'comet', 'asteroid', 'meteor', 'solar system'],
    emoji: '🪐'
  },
  'Music & Instruments': {
    keywords: ['music', 'song', 'sing', 'singer', 'band', 'choir', 'orchestra', 'instrument', 'guitar', 'piano', 'violin', 'drum', 'flute', 'note', 'rhythm', 'melody', 'jazz', 'rock', 'pop', 'classical'],
    emoji: '🎵'
  },
  'Literature & Books': {
    keywords: ['book', 'read', 'writer', 'author', 'novel', 'story', 'poem', 'poetry', 'chapter', 'page', 'character', 'plot', 'publish', 'library', 'fairy tale', 'fiction'],
    emoji: '📚'
  },
  'History & Past': {
    keywords: ['history', 'past', 'century', 'decade', 'ancient', 'empire', 'king', 'queen', 'knight', 'revolution', 'warrior', 'castle', 'knight', 'emperor', 'myth'],
    emoji: '⏳'
  },
  'Fantasy & Magic': {
    keywords: ['magic', 'fantasy', 'dragon', 'wizard', 'witch', 'spell', 'fairy', 'ghost', 'monster', 'sword', 'elf', 'demon', 'curse', 'wand'],
    emoji: '🧙'
  },
  'Humor & Jokes': {
    keywords: ['joke', 'funny', 'laugh', 'humor', 'comedy', 'hilarious', 'silly', 'clown', 'fool', 'prank', 'smile', 'amusing', 'crazy', 'stupid'],
    emoji: '😂'
  },
  'Romance & Dating': {
    keywords: ['romance', 'date', 'kiss', 'hug', 'love', 'darling', 'sweetheart', 'boyfriend', 'girlfriend', 'marry', 'wedding', 'fiance', 'bride', 'groom', 'valentine'],
    emoji: '💘'
  },
  'Holidays & Celebrations': {
    keywords: ['holiday', 'celebrate', 'party', 'birthday', 'christmas', 'new year', 'easter', 'halloween', 'thanksgiving', 'gift', 'present', 'cake', 'candle', 'festival', 'carnival'],
    emoji: '🎉'
  },
  'Describing People': {
    keywords: ['tall', 'short', 'fat', 'thin', 'beautiful', 'ugly', 'handsome', 'pretty', 'cute', 'smart', 'clever', 'stupid', 'lazy', 'hardworking', 'kind', 'polite', 'rude', 'brave', 'coward', 'shy', 'honest'],
    emoji: '👤'
  },
  'Daily Routine': {
    keywords: ['wake up', 'get up', 'brush', 'teeth', 'shower', 'dress', 'breakfast', 'work', 'school', 'lunch', 'dinner', 'sleep', 'bed', 'routine', 'habit', 'everyday', 'usually', 'always', 'sometimes', 'never'],
    emoji: '🌅'
  },
  'Opinions & Arguments': {
    keywords: ['opinion', 'think', 'believe', 'agree', 'disagree', 'argue', 'right', 'wrong', 'true', 'false', 'sure', 'certain', 'maybe', 'perhaps', 'probably', 'idea', 'mind', 'point', 'view'],
    emoji: '🗣️'
  },
  'Directions & Navigation': {
    keywords: ['direction', 'left', 'right', 'straight', 'turn', 'corner', 'street', 'road', 'block', 'cross', 'past', 'near', 'far', 'close', 'ahead', 'behind', 'between', 'next to', 'opposite', 'front', 'back', 'map'],
    emoji: '🧭'
  },
  'Compliments & Praise': {
    keywords: ['great', 'awesome', 'amazing', 'perfect', 'brilliant', 'fantastic', 'excellent', 'wonderful', 'beautiful', 'handsome', 'smart', 'clever', 'genius', 'proud', 'good job', 'well done'],
    emoji: '🌟'
  },
  'Apologies & Forgiveness': {
    keywords: ['sorry', 'apologize', 'forgive', 'excuse', 'pardon', 'regret', 'mistake', 'fault', 'blame', 'guilty', 'accident', 'my bad', 'forgiveness'],
    emoji: '🙏'
  },
  'Requests & Permissions': {
    keywords: ['can I', 'could I', 'may I', 'would you', 'do you mind', 'let me', 'allow', 'permit', 'ask', 'request', 'borrow', 'lend', 'help', 'favor'],
    emoji: '🙋'
  },
  'Offers & Invitations': {
    keywords: ['would you like', 'do you want', 'invite', 'offer', 'join', 'come with', 'guest', 'host', 'welcome', 'treat', 'pay for', 'my treat'],
    emoji: '🤝'
  },
  'Advice & Suggestions': {
    keywords: ['should', 'ought to', 'advise', 'suggest', 'recommend', 'better', 'idea', 'tip', 'warn', 'warning', 'careful', 'watch out', 'listen to me'],
    emoji: '💡'
  },
  'Complaints & Dissatisfaction': {
    keywords: ['complain', 'terrible', 'awful', 'horrible', 'bad', 'worst', 'hate', 'annoying', 'bother', 'bothering', 'irritating', 'upset', 'disappointed', 'unacceptable', 'manager'],
    emoji: '😠'
  },
  'Promises & Commitments': {
    keywords: ['promise', 'swear', 'guarantee', 'commit', 'word', 'trust', 'rely on', 'depend on', 'never', 'always', 'forever', 'secret', 'keep a secret'],
    emoji: '🤞'
  },
  'Sympathy & Condolences': {
    keywords: ['sympathy', 'condolence', 'sorry for your loss', 'tragedy', 'sadness', 'grief', 'mourn', 'pity', 'shame', 'comfort', 'console', 'thoughts and prayers'],
    emoji: '💐'
  },
  'Idioms & Proverbs': {
    keywords: ['piece of cake', 'break a leg', 'under the weather', 'spill the beans', 'cost an arm and a leg', 'hit the sack', 'bite the bullet', 'raining cats and dogs', 'proverb', 'idiom', 'saying'],
    emoji: '🧩'
  },
  'Slang & Informal': {
    keywords: ['gonna', 'wanna', 'gotta', 'gimme', 'lemme', 'kinda', 'sorta', 'outta', 'dude', 'guy', 'cool', 'chill', 'crazy', 'awesome', 'sucks', 'crap', 'bullshit', 'freak', 'freaking', 'damn'],
    emoji: '😎'
  },
  'At the Airport': {
    keywords: ['check-in', 'boarding', 'pass', 'gate', 'terminal', 'security', 'customs', 'baggage', 'claim', 'carousel', 'flight', 'delayed', 'cancelled', 'departures', 'arrivals', 'aisle', 'window seat'],
    emoji: '🛫'
  },
  'At the Restaurant': {
    keywords: ['menu', 'starter', 'appetizer', 'main course', 'dessert', 'beverage', 'napkin', 'waiter', 'waitress', 'tip', 'bill', 'check', 'reservation', 'table for', 'vegetarian', 'vegan', 'spicy'],
    emoji: '🍴'
  },
  'At the Hotel': {
    keywords: ['front desk', 'reception', 'lobby', 'key card', 'room service', 'housekeeping', 'wake-up call', 'check out', 'check in', 'deposit', 'vacancy', 'single room', 'double room', 'suite'],
    emoji: '🛏️'
  },
  'At the Bank': {
    keywords: ['open an account', 'deposit', 'withdraw', 'transfer', 'balance', 'teller', 'cashier', 'ATM', 'credit card', 'debit card', 'pin number', 'exchange rate', 'currency', 'loan', 'mortgage'],
    emoji: '💳'
  },
  'At the Doctor': {
    keywords: ['appointment', 'prescription', 'pharmacy', 'symptoms', 'pain', 'hurt', 'fever', 'cough', 'sneeze', 'dizzy', 'nauseous', 'allergy', 'allergic', 'blood pressure', 'temperature'],
    emoji: '🩺'
  },
  'Job Interview': {
    keywords: ['resume', 'CV', 'experience', 'skills', 'strengths', 'weaknesses', 'hire', 'fire', 'position', 'qualifications', 'background', 'apply', 'applicant', 'candidate', 'employer'],
    emoji: '🤝'
  },
  'Real Estate & Housing': {
    keywords: ['rent', 'lease', 'landlord', 'tenant', 'deposit', 'utilities', 'neighborhood', 'suburbs', 'downtown', 'mortgage', 'property', 'real estate', 'agent', 'broker', 'viewing'],
    emoji: '🏘️'
  },
  'Crime & Police': {
    keywords: ['police', 'cop', 'arrest', 'suspect', 'victim', 'witness', 'evidence', 'clue', 'investigate', 'detective', 'murder', 'robbery', 'theft', 'steal', 'prison', 'jail', 'court', 'judge'],
    emoji: '🚓'
  },
  'Hobbies: Photography': {
    keywords: ['camera', 'photo', 'photograph', 'photography', 'lens', 'focus', 'picture', 'shoot', 'capture', 'portrait', 'landscape', 'flash', 'album', 'frame'],
    emoji: '📸'
  },
  'Hobbies: Gardening': {
    keywords: ['garden', 'gardening', 'plant', 'flower', 'tree', 'seed', 'water', 'soil', 'dirt', 'grass', 'weed', 'lawn', 'mow', 'pot', 'grow'],
    emoji: '🪴'
  },
  'Computers & Software': {
    keywords: ['software', 'hardware', 'program', 'code', 'programming', 'developer', 'bug', 'error', 'fix', 'install', 'uninstall', 'update', 'upgrade', 'virus', 'antivirus', 'file', 'folder'],
    emoji: '🖥️'
  },
  'Social Media & Chat': {
    keywords: ['post', 'like', 'share', 'comment', 'follow', 'follower', 'profile', 'status', 'chat', 'message', 'text', 'online', 'offline', 'emoji', 'hashtag', 'viral', 'trend'],
    emoji: '📱'
  },
  'Personal Care & Hygiene': {
    keywords: ['shower', 'bath', 'soap', 'shampoo', 'towel', 'brush', 'toothpaste', 'toothbrush', 'comb', 'haircut', 'shave', 'razor', 'perfume', 'makeup', 'mirror'],
    emoji: '🧼'
  },
  'Household Chores': {
    keywords: ['chore', 'clean', 'sweep', 'vacuum', 'dust', 'mop', 'wash', 'laundry', 'iron', 'fold', 'dishes', 'trash', 'garbage', 'rubbish', 'tidy'],
    emoji: '🧹'
  },
  'Transportation: Train & Subway': {
    keywords: ['train', 'subway', 'metro', 'underground', 'tube', 'station', 'platform', 'ticket', 'fare', 'conductor', 'passenger', 'track', 'express', 'local'],
    emoji: '🚆'
  },
  'Transportation: Bus & Taxi': {
    keywords: ['bus', 'taxi', 'cab', 'stop', 'driver', 'fare', 'route', 'schedule', 'timetable', 'transfer', 'ride', 'passenger', 'seat'],
    emoji: '🚌'
  },
  'School & Classroom': {
    keywords: ['classroom', 'desk', 'board', 'chalk', 'marker', 'pen', 'pencil', 'eraser', 'notebook', 'paper', 'textbook', 'backpack', 'homework', 'assignment', 'grade', 'mark'],
    emoji: '🏫'
  },
  'Pets: Dogs & Cats': {
    keywords: ['dog', 'puppy', 'bark', 'bite', 'leash', 'walk the dog', 'cat', 'kitten', 'meow', 'purr', 'scratch', 'pet', 'feed', 'litter'],
    emoji: '🐶'
  },
  'Law & Court': {
    keywords: ['lawyer', 'attorney', 'judge', 'court', 'jury', 'trial', 'sue', 'lawsuit', 'guilty', 'innocent', 'evidence', 'testify', 'witness', 'sentence', 'prison', 'jail', 'bail'],
    emoji: '⚖️'
  },
  'Politics & Elections': {
    keywords: ['election', 'vote', 'voter', 'candidate', 'campaign', 'debate', 'president', 'mayor', 'governor', 'senate', 'parliament', 'democracy', 'dictator', 'policy', 'tax'],
    emoji: '🗳️'
  },
  'Economy & Trade': {
    keywords: ['economy', 'economic', 'trade', 'export', 'import', 'market', 'stock', 'share', 'invest', 'investment', 'inflation', 'recession', 'crisis', 'profit', 'loss', 'capital'],
    emoji: '📈'
  },
  'Religion & Spirituality': {
    keywords: ['god', 'jesus', 'allah', 'buddha', 'pray', 'prayer', 'church', 'mosque', 'temple', 'synagogue', 'priest', 'monk', 'nun', 'holy', 'sacred', 'sin', 'heaven', 'hell'],
    emoji: '🙏'
  },
  'Geography & Landscapes': {
    keywords: ['mountain', 'hill', 'valley', 'river', 'lake', 'ocean', 'sea', 'beach', 'coast', 'island', 'peninsula', 'desert', 'forest', 'jungle', 'cave', 'waterfall', 'volcano'],
    emoji: '🏔️'
  },
  'Space & Universe': {
    keywords: ['space', 'universe', 'galaxy', 'star', 'planet', 'sun', 'moon', 'earth', 'mars', 'jupiter', 'saturn', 'comet', 'asteroid', 'meteor', 'black hole', 'telescope', 'alien'],
    emoji: '🌌'
  },
  'Science & Physics': {
    keywords: ['physics', 'chemistry', 'biology', 'atom', 'molecule', 'electron', 'gravity', 'energy', 'force', 'mass', 'speed', 'velocity', 'experiment', 'laboratory', 'microscope'],
    emoji: '🔬'
  },
  'Mathematics & Geometry': {
    keywords: ['math', 'algebra', 'geometry', 'calculus', 'equation', 'formula', 'triangle', 'square', 'circle', 'rectangle', 'angle', 'degree', 'measure', 'calculate', 'solve'],
    emoji: '📐'
  },
  'History & Empires': {
    keywords: ['history', 'ancient', 'empire', 'roman', 'greek', 'egyptian', 'king', 'queen', 'emperor', 'pharaoh', 'dynasty', 'revolution', 'rebellion', 'colony', 'civilization'],
    emoji: '📜'
  },
  'Art & Painting': {
    keywords: ['art', 'artist', 'paint', 'painting', 'draw', 'drawing', 'sketch', 'canvas', 'brush', 'color', 'palette', 'portrait', 'landscape', 'gallery', 'museum', 'exhibition'],
    emoji: '🎨'
  },
  'Technology & Gadgets': {
    keywords: ['technology', 'gadget', 'device', 'tablet', 'smartwatch', 'headphones', 'earphones', 'charger', 'cable', 'screen', 'battery', 'wireless', 'bluetooth', 'innovative', 'digital'],
    emoji: '🔌'
  },
  'Internet & Websites': {
    keywords: ['website', 'browser', 'search engine', 'link', 'click', 'download', 'upload', 'server', 'cloud', 'data', 'database', 'password', 'login', 'log out', 'account', 'hacker', 'cyber'],
    emoji: '🌐'
  },
  'Vehicles & Transport': {
    keywords: ['vehicle', 'truck', 'van', 'motorcycle', 'bike', 'bicycle', 'scooter', 'helicopter', 'boat', 'ship', 'ferry', 'submarine', 'wheel', 'engine', 'fuel'],
    emoji: '🛵'
  },
  'Materials & Substances': {
    keywords: ['material', 'wood', 'metal', 'plastic', 'glass', 'stone', 'rock', 'sand', 'clay', 'cotton', 'wool', 'silk', 'leather', 'paper', 'cardboard', 'rubber'],
    emoji: '🧱'
  },
  'Tools & Hardware': {
    keywords: ['hardware', 'tool', 'hammer', 'screwdriver', 'pliers', 'wrench', 'drill', 'saw', 'nail', 'screw', 'bolt', 'nut', 'tape', 'glue', 'paint', 'brush'],
    emoji: '🧰'
  },
  'Office & Stationery': {
    keywords: ['office', 'desk', 'chair', 'computer', 'printer', 'scanner', 'copier', 'paper', 'pen', 'pencil', 'stapler', 'folder', 'file', 'envelope', 'stamp', 'clip'],
    emoji: '🖇️'
  },
  'Furniture & Decor': {
    keywords: ['furniture', 'sofa', 'couch', 'armchair', 'table', 'chair', 'bed', 'wardrobe', 'closet', 'shelf', 'bookshelf', 'carpet', 'rug', 'curtain', 'lamp', 'mirror', 'picture'],
    emoji: '🛋️'
  },
  'Clothes & Accessories': {
    keywords: ['clothing', 'clothes', 'shirt', 'pants', 'jeans', 'dress', 'skirt', 'jacket', 'coat', 'sweater', 'sweater', 'shoes', 'boots', 'sneakers', 'socks', 'hat', 'cap', 'scarf', 'gloves', 'belt', 'tie', 'glasses', 'sunglasses', 'watch', 'jewelry', 'ring', 'necklace', 'bracelet', 'earrings'],
    emoji: '👔'
  },
  'Food & Ingredients': {
    keywords: ['food', 'ingredient', 'meat', 'beef', 'pork', 'chicken', 'fish', 'seafood', 'vegetable', 'fruit', 'apple', 'banana', 'orange', 'potato', 'tomato', 'onion', 'carrot', 'bread', 'rice', 'pasta', 'noodle', 'cheese', 'milk', 'butter', 'egg', 'sugar', 'salt', 'pepper', 'spice'],
    emoji: '🥕'
  },
  'Drinks & Beverages': {
    keywords: ['drink', 'beverage', 'water', 'juice', 'soda', 'coke', 'tea', 'coffee', 'milk', 'beer', 'wine', 'alcohol', 'liquor', 'cocktail', 'glass', 'cup', 'mug', 'bottle'],
    emoji: '🥤'
  },
  'Programming Languages': {
    keywords: ['javascript', 'python', 'java', 'c++', 'ruby', 'php', 'swift', 'typescript', 'html', 'css', 'react', 'node', 'sql', 'database', 'frontend', 'backend'],
    emoji: '🧑‍💻'
  },
  'Movies & Cinema': {
    keywords: ['movie', 'film', 'cinema', 'theater', 'director', 'actor', 'actress', 'scene', 'script', 'comedy', 'drama', 'horror', 'action', 'thriller', 'documentary', 'ticket', 'popcorn'],
    emoji: '🍿'
  },
  'Fitness & Gym': {
    keywords: ['gym', 'workout', 'exercise', 'muscle', 'lift', 'weight', 'dumbbell', 'barbell', 'squat', 'push up', 'cardio', 'treadmill', 'run', 'sweat', 'protein', 'diet'],
    emoji: '🏋️'
  },
  'Mythology & Folklore': {
    keywords: ['myth', 'mythology', 'legend', 'folklore', 'gods', 'goddess', 'hero', 'monster', 'creature', 'tale', 'fable', 'epic', 'dragon', 'unicorn', 'mermaid', 'vampire', 'werewolf', 'zombie'],
    emoji: '🦄'
  },
  'Philosophy & Ethics': {
    keywords: ['philosophy', 'ethics', 'moral', 'immoral', 'truth', 'logic', 'reason', 'meaning', 'existence', 'existential', 'soul', 'mind', 'wisdom', 'knowledge', 'belief', 'value', 'virtue', 'vice'],
    emoji: '🤔'
  },
  'Psychology & Mind': {
    keywords: ['psychology', 'mind', 'brain', 'behavior', 'mental', 'cognitive', 'memory', 'thought', 'conscious', 'unconscious', 'subconscious', 'personality', 'ego', 'identity', 'trauma', 'therapy'],
    emoji: '🧠'
  },
  'Linguistics & Languages': {
    keywords: ['language', 'linguistics', 'grammar', 'vocabulary', 'word', 'sentence', 'phrase', 'dialect', 'accent', 'pronunciation', 'translate', 'translation', 'bilingual', 'multilingual', 'fluent', 'fluent', 'slang'],
    emoji: '🗣️'
  },
  'Anthropology & Cultures': {
    keywords: ['anthropology', 'culture', 'cultural', 'society', 'tradition', 'custom', 'ritual', 'heritage', 'tribe', 'indigenous', 'native', 'ethnic', 'ethnicity', 'diversity', 'ancestor', 'descendant'],
    emoji: '🌍'
  },
  'Sociology & Demographics': {
    keywords: ['sociology', 'demographic', 'population', 'community', 'class', 'status', 'gender', 'race', 'inequality', 'equality', 'discrimination', 'prejudice', 'stereotype', 'minority', 'majority'],
    emoji: '👥'
  },
  'Economics & Markets': {
    keywords: ['economics', 'market', 'supply', 'demand', 'price', 'cost', 'revenue', 'income', 'expense', 'budget', 'finance', 'financial', 'currency', 'exchange', 'trade', 'commerce', 'industry', 'monopoly'],
    emoji: '💹'
  },
  'Business & Management': {
    keywords: ['business', 'management', 'manager', 'leader', 'leadership', 'strategy', 'plan', 'goal', 'objective', 'target', 'success', 'failure', 'risk', 'opportunity', 'innovation', 'entrepreneur'],
    emoji: '📊'
  },
  'Marketing & Advertising': {
    keywords: ['marketing', 'advertising', 'ad', 'commercial', 'brand', 'branding', 'campaign', 'promotion', 'sponsor', 'sponsor', 'target audience', 'consumer', 'customer', 'client', 'sales', 'discount'],
    emoji: '📢'
  },
  'Public Relations & Media': {
    keywords: ['public relations', 'PR', 'media', 'press', 'journalist', 'reporter', 'interview', 'statement', 'release', 'conference', 'news', 'broadcast', 'publish', 'article', 'headline', 'rumor', 'scandal'],
    emoji: '🎙️'
  },
  'Camping & Outdoors': {
    keywords: ['camp', 'camping', 'tent', 'sleeping bag', 'campfire', 'fire', 'wood', 'hike', 'hiking', 'trail', 'compass', 'flashlight', 'marshmallow', 'wildlife', 'survive'],
    emoji: '🏕️'
  },
  'Beach & Ocean': {
    keywords: ['beach', 'ocean', 'sea', 'sand', 'wave', 'surf', 'surfing', 'swim', 'swimsuit', 'sunscreen', 'sunburn', 'towel', 'shell', 'crab', 'shark', 'dolphin'],
    emoji: '🏖️'
  },
  'Winter & Snow': {
    keywords: ['winter', 'snow', 'ice', 'cold', 'freeze', 'freezing', 'snowman', 'snowball', 'ski', 'skiing', 'snowboard', 'skate', 'ice skate', 'fireplace', 'heater', 'blanket'],
    emoji: '⛄'
  },
  'Desserts & Sweets': {
    keywords: ['dessert', 'sweet', 'sugar', 'cake', 'chocolate', 'candy', 'cookie', 'pie', 'ice cream', 'pudding', 'honey', 'syrup', 'jam', 'jelly', 'marshmallow', 'delicious'],
    emoji: '🍰'
  },
  'Barbershop & Haircut': {
    keywords: ['barber', 'barbershop', 'haircut', 'trim', 'fade', 'beard', 'mustache', 'shave', 'clipper', 'scissors', 'pomade', 'gel', 'sideburns', 'hairline', 'buzz cut', 'comb over'],
    emoji: '💈'
  },
  'Motorsport (Spectator)': {
    keywords: ['race', 'racing', 'formula 1', 'f1', 'nascar', 'rally', 'track', 'circuit', 'grand prix', 'lap', 'overtake', 'pit stop', 'standings', 'podium', 'checkered flag', 'champion', 'spectator', 'grandstand'],
    emoji: '🏁'
  },
  'Motorsport (Engineer & Mechanic)': {
    keywords: ['engine', 'chassis', 'aerodynamics', 'downforce', 'suspension', 'telemetry', 'tire', 'tyre pressure', 'gearbox', 'pit crew', 'mechanic', 'engineer', 'setup', 'torque', 'horsepower', 'brake balance', 'reliability', 'wind tunnel'],
    emoji: '⚙️'
  },
  'Motorsport (Driver)': {
    keywords: ['driver', 'pilot', 'cockpit', 'steering wheel', 'apex', 'braking zone', 'slipstream', 'drafting', 'understeer', 'oversteer', 'pole position', 'qualifying', 'throttle', 'visor', 'helmet', 'racing line'],
    emoji: '🏎️'
  },
  'Space & Exploration': {
    keywords: ['spacecraft', 'astronaut', 'orbit', 'nasa', 'spacex', 'satellite', 'telescope', 'galaxy', 'milky way', 'black hole', 'zero gravity', 'rocket launch', 'lunar', 'martian', 'interstellar', 'cosmos'],
    emoji: '🚀'
  },
  'Aviation & Flying': {
    keywords: ['aviation', 'pilot', 'aircraft', 'airplane', 'helicopter', 'runway', 'takeoff', 'landing', 'altitude', 'cockpit', 'air traffic control', 'radar', 'fuselage', 'turbines', 'autopilot', 'jet', 'airline'],
    emoji: '🛩️'
  },
  'Aquariums & Fishkeeping': {
    keywords: ['aquarium', 'fish tank', 'filter', 'pump', 'water change', 'algae', 'coral', 'freshwater', 'saltwater', 'marine', 'aquascape', 'substrate', 'cichlid', 'goldfish', 'tetra', 'guppy', 'heater', 'ph level'],
    emoji: '🐠'
  },
  'Bicycles & Cycling': {
    keywords: ['bicycle', 'bike', 'cycling', 'cyclist', 'pedal', 'saddle', 'handlebar', 'chain', 'gear', 'derailleur', 'brake', 'spoke', 'tire', 'helmet', 'mountain bike', 'road bike', 'bmx'],
    emoji: '🚲'
  },
  'Fishing & Angling': {
    keywords: ['fishing', 'angler', 'fishing rod', 'reel', 'bait', 'lure', 'hook', 'line', 'catch', 'tackle box', 'boat', 'lake', 'river', 'trout', 'bass', 'salmon', 'cast'],
    emoji: '🎣'
  },
  'Video Games (General)': {
    keywords: ['video game', 'gamer', 'console', 'pc gaming', 'controller', 'gamepad', 'joystick', 'multiplayer', 'single player', 'online', 'offline', 'level up', 'boss', 'npc', 'quest', 'achievement', 'esports'],
    emoji: '🎮'
  },
  'Video Games (Shooters & Action)': {
    keywords: ['shooter', 'fps', 'first person shooter', 'third person', 'sniper', 'rifle', 'ammo', 'reload', 'headshot', 'frag', 'spawn', 'respawn', 'loot', 'cover', 'crosshair', 'grenade', 'stealth'],
    emoji: '🔫'
  },
  'Video Games (RPG & Strategy)': {
    keywords: ['rpg', 'role playing', 'strategy', 'rts', 'turn based', 'inventory', 'skill tree', 'mana', 'health potion', 'guild', 'clan', 'dungeon', 'raid', 'crafting', 'tactics', 'base building', 'resource'],
    emoji: '🛡️'
  },
  'Video Games (Simulators & Racing)': {
    keywords: ['simulator', 'simulation', 'racing game', 'flight sim', 'farming sim', 'management', 'career mode', 'steering wheel', 'force feedback', 'virtual reality', 'vr', 'sandbox', 'tycoon'],
    emoji: '🕹️'
  }
};

const PHRASES_PER_DICT = 10000; 
const MAX_DICTS_PER_TOPIC = 1; 

async function generate() {
  console.log("Reading rus.txt...");
  if (!fs.existsSync('rus.txt')) {
    console.error("rus.txt not found. Please download it first.");
    return;
  }
  const content = fs.readFileSync('rus.txt', 'utf8');
  const lines = content.split('\n');
  
  const categorized = {};
  for (const topic of Object.keys(TOPICS)) {
    categorized[topic] = [];
  }
  
  console.log(`Processing ${lines.length} lines...`);
  
  const seenEn = new Set();

  for (const line of lines) {
    if (!line) continue;
    const parts = line.split('\t');
    if (parts.length < 2) continue;
    
    const en = parts[0].trim();
    const ru = parts[1].trim();
    
    // Use reasonable sentence lengths for a phrasebook (3 to 12 words)
    const wordCount = en.split(' ').length;
    if (wordCount < 3 || wordCount > 12) continue;
    
    const enLower = en.toLowerCase();
    
    for (const [topic, info] of Object.entries(TOPICS)) {
      // Must contain at least one keyword as a whole word
      const hasKeyword = info.keywords.some(kw => {
        // Simple word boundary check
        return enLower === kw || enLower.startsWith(kw + ' ') || enLower.endsWith(' ' + kw) || enLower.includes(' ' + kw + ' ') || enLower.includes(kw + '?') || enLower.includes(kw + '!') || enLower.includes(kw + '.');
      });
      
      if (hasKeyword && !seenEn.has(enLower)) {
        categorized[topic].push({ en, ru });
        seenEn.add(enLower);
        break; // Only assign to the first matching topic
      }
    }
  }
  
  const manifestPath = 'public/dictionaries/manifest.json';
  let manifest = { dictionaries: [] };
  if (fs.existsSync(manifestPath)) {
    manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  }
  
  manifest.dictionaries = manifest.dictionaries.filter(d => !d.id.startsWith('phrasebook-'));
  const newDicts = [];

  for (const [topic, sentences] of Object.entries(categorized)) {
    console.log(`${topic}: found ${sentences.length} sentences`);
    
    if (sentences.length === 0) continue;
    
    // Shuffle
    sentences.sort(() => 0.5 - Math.random());
    
    // Limit total dicts per topic
    const numDicts = Math.min(Math.ceil(sentences.length / PHRASES_PER_DICT), MAX_DICTS_PER_TOPIC);
    
    for (let i = 0; i < numDicts; i++) {
      const chunk = sentences.slice(i * PHRASES_PER_DICT, (i + 1) * PHRASES_PER_DICT);
      if (chunk.length < 15) continue; // Skip too small chunks
      
      const topicSafe = topic.toLowerCase().replace(/[^a-z0-9]/g, '');
      const dictId = `phrasebook-${topicSafe}`;
      const dictName = `${topic}`;
      const dictDesc = `Phrasebook for ${topic}`;
      const fileName = `dictionaries/${dictId}.json`;
      
      const entries = chunk.map((s, idx) => ({
        id: `pb_${topicSafe}_${idx}`,
        word: s.en,
        translation: s.ru,
        language: 'en'
      }));
      
      const dictObj = {
        id: dictId,
        name: dictName,
        description: dictDesc,
        entries
      };
      
      fs.writeFileSync(`public/${fileName}`, JSON.stringify(dictObj, null, 2));
      
      newDicts.push({
        id: dictId,
        name: dictName,
        description: dictDesc,
        file: fileName,
        wordCount: chunk.length,
        emoji: TOPICS[topic].emoji
      });
    }
  }
  
  manifest.dictionaries.push(...newDicts);
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log("Done generating phrasebooks.");
}

generate();
