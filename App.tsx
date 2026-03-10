
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, PenTool, User, Bell, Menu, Plus, ArrowUp, Zap, MessageSquareQuote, Wand2, Sparkles, ListChecks, Send, MessageCircle } from 'lucide-react';
import PhoneticInput from './components/PhoneticInput';
import TaqtiTable from './components/TaqtiTable';
import PoetryCard from './components/PoetryCard';
import { SAMPLE_FEED } from './constants';
import { PoetryItem, MeterAnalysis } from './types';
import { 
  analyzePoetryMeter, 
  analyzePoetryLiterary, 
  sendPoetryChatMessage
} from './services/geminiService';

interface ChatMessage {
  role: 'user' | 'ustad';
  text: string;
  isError?: boolean;
}

const App: React.FC = () => {
  const [feed, setFeed] = useState<PoetryItem[]>(SAMPLE_FEED);
  const [loading, setLoading] = useState(false);
  const [loadingProcess, setLoadingProcess] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [workMode, setWorkMode] = useState('tajziya');
  const [analysis, setAnalysis] = useState<MeterAnalysis | null>(null);
  const [processResult, setProcessResult] = useState<string | string[] | null>(null);
  const [activeTab, setActiveTab] = useState('feed');
  const [showScrollTop, setShowScrollTop] = useState(false);
  
  // Chat States
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: 'ustad', text: 'خوش آمدید! میں آپ کے کلام میں کیا مدد کر سکتا ہوں؟' }
  ]);
  const chatWindowRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback(() => {
    const scrollPosition = window.innerHeight + window.scrollY;
    if (scrollPosition > 1000) setShowScrollTop(true);
    else setShowScrollTop(false);

    if (scrollPosition >= document.body.offsetHeight - 600 && !loading && activeTab === 'feed') {
      setLoading(true);
      setTimeout(() => {
        const moreItems = SAMPLE_FEED.map(item => ({ 
          ...item, id: Math.random().toString(36).substr(2, 9), likes: Math.floor(Math.random() * 2000)
        }));
        setFeed(prev => [...prev, ...moreItems]);
        setLoading(false);
      }, 1200);
    }
  }, [loading, activeTab]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  useEffect(() => {
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleProcessRequest = async () => {
    const cleanText = userInput.split('\n').filter(line => line.trim() !== "").join('\n');
    if (!cleanText && workMode !== 'generate_full') {
      alert("براہ کرم کچھ تحریر کریں!");
      return;
    }

    setLoadingProcess(true);
    setProcessResult(null);
    setAnalysis(null);

    try {
      // Step 1: Analyze Meter
      if (cleanText) {
        const meterResult = await analyzePoetryMeter(cleanText);
        setAnalysis(meterResult);
      }

      // Staggering: Add a small delay between calls to avoid bursting the API rate limit
      await new Promise(resolve => setTimeout(resolve, 800));

      // Step 2: Perform Literary Action
      const tajResult = await analyzePoetryLiterary(cleanText || "مجھے ایک غزل لکھ کر دیں", workMode);
      setProcessResult(tajResult);
    } catch (err: any) {
      console.error("App Processing Error:", err);
      setProcessResult("ایرر: سرور اس وقت جواب نہیں دے پا رہا۔ براہ کرم کچھ سیکنڈز بعد دوبارہ کوشش کریں۔");
    } finally {
      setLoadingProcess(false);
    }
  };

  const handleSendChat = async () => {
    const userMsg = chatInput.trim();
    if (userMsg === "") return;

    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setChatInput(''); 

    try {
      const currentBahar = analysis?.name || "";
      const response = await sendPoetryChatMessage(userMsg, userInput, currentBahar);
      setChatMessages(prev => [...prev, { role: 'ustad', text: response }]);
    } catch (error) {
      setChatMessages(prev => [...prev, { role: 'ustad', text: 'رابطہ منقطع ہو گیا ہے۔ معذرت، میں ابھی جواب نہیں دے پا رہا۔', isError: true }]);
    }
  };

  const selectSuggestion = (verse: string) => {
    setUserInput(verse);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <header className="sticky top-0 z-[100] bg-aruuz-primary text-white shadow-xl py-4 px-6 md:px-12 flex justify-between items-center">
        <div className="flex items-center gap-6">
          <Menu className="cursor-pointer md:hidden" />
          <div className="flex flex-col items-center">
            <h1 className="text-3xl font-bold tracking-tighter cursor-pointer" onClick={() => setActiveTab('feed')}>ARUUZ</h1>
            <span className="text-[10px] tracking-[0.3em] text-aruuz-accent uppercase">Poetry Portal</span>
          </div>
        </div>
        <nav className="hidden md:flex gap-10 items-center urdu-text text-xl">
          <button onClick={() => setActiveTab('feed')} className={`hover:text-aruuz-accent relative pb-1 ${activeTab === 'feed' ? 'text-aruuz-accent border-b-2 border-aruuz-accent' : ''}`}>گھربار</button>
          <button onClick={() => setActiveTab('analyze')} className={`hover:text-aruuz-accent relative pb-1 ${activeTab === 'analyze' ? 'text-aruuz-accent border-b-2 border-aruuz-accent' : ''}`}>تقطیع کار</button>
          <button className="hover:text-aruuz-accent">اساتذہ</button>
          <button className="hover:text-aruuz-accent">لغت</button>
        </nav>
        <div className="flex items-center gap-6">
          <Search size={22} className="cursor-pointer" />
          <div className="w-10 h-10 rounded-full bg-aruuz-accent border-2 border-aruuz-primary flex items-center justify-center text-white cursor-pointer"><User size={20} /></div>
        </div>
      </header>

      <section className="bg-aruuz-primary text-white pt-24 pb-48 px-6 text-center relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-5xl md:text-7xl font-bold urdu-text mb-8 drop-shadow-lg">اردو شاعری کی جامع بیٹھک</h2>
          <p className="max-w-2xl mx-auto text-gray-300 text-xl naskh-text leading-relaxed px-4">فنِ شاعری سیکھنے، تقطیع کرنے اور اساتذہ کے کلام سے فیض پانے کا مستند پلیٹ فارم۔</p>
        </div>
      </section>

      <main className="main-raised p-6 md:p-16">
        <div className="max-w-6xl mx-auto">
          {activeTab === 'feed' && (
            <div className="fade-in max-w-4xl mx-auto space-y-10">
              {feed.map((item) => <PoetryCard key={item.id} item={item} />)}
            </div>
          )}

          {activeTab === 'analyze' && (
            <div className="fade-in">
              {/* Work Mode Selector */}
              <div className="main-raised2 urdu-medium p-6 mb-8 bg-[#f9f9f9] max-w-4xl mx-auto border-r-4 border-aruuz-primary">
                <h5 className="title text-right mb-4 font-bold flex items-center justify-end gap-2">آپ کیا کرنا چاہتے ہیں؟ <ListChecks className="text-aruuz-primary" /></h5>
                <div className="w-full" dir="rtl">
                  <select id="workMode" value={workMode} onChange={(e) => setWorkMode(e.target.value)} className="w-full p-3 border rounded-lg urdu-small bg-white shadow-inner outline-none">
                    <option value="tajziya">صرف تجزیہ (خوبیوں اور خامیوں پر نقد)</option>
                    <option value="islah">مکمل اصلاح (متبادل مصرعوں کے ساتھ)</option>
                    <option value="completion">مصرع کی تکمیل (دوسرا مصرع لکھوانا)</option>
                    <option value="alternatives">ایک مصرعے کے 10 متبادل</option>
                    <option value="tazmeen">تظمین (5 مصرعوں پر مشتمل بند بنانا)</option>
                    <option value="generate_full">غزل یا نعت کی تخلیق (قافیہ اور ردیف دیں)</option>
                  </select>
                </div>
              </div>

              <div className="max-w-4xl mx-auto bg-gray-50 p-8 rounded-3xl shadow-inner border border-gray-200">
                <PhoneticInput id="poetryEditor" placeholder="اپنے اشعار یہاں لکھیں..." value={userInput} onChange={setUserInput} multiline={true} rows={10} className="urdu-large" />
                <div className="mt-6"><button id="btnProcess" onClick={handleProcessRequest} disabled={loadingProcess} className="w-full bg-aruuz-primary text-white py-5 rounded-2xl text-2xl font-bold urdu-text flex items-center justify-center gap-4 hover:shadow-2xl transition-all disabled:opacity-50"><Zap size={28} /> {loadingProcess ? 'جاری ہے...' : 'عمل شروع کریں'}</button></div>
              </div>

              {analysis && <div className="max-w-4xl mx-auto mt-10"><TaqtiTable analysis={analysis} /></div>}

              {/* Detailed Inspection & Chat Section */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mt-10" dir="rtl">
                <div className="md:col-span-8">
                  <div className="main-raised2 padding-20 h-full min-h-[500px] flex flex-col">
                    <h4 className="urdu-large text-center border-b pb-4 mb-4 text-aruuz-primary font-bold">غزل کا تفصیلی معائنہ</h4>
                    <div id="ghazalResult" className="urdu-naskh-medium flex-grow overflow-y-auto pr-2 custom-scroll max-h-[500px]">
                      {loadingProcess ? (
                        <div className="flex flex-col items-center justify-center h-full gap-4 text-gray-400">
                           <Sparkles size={40} className="animate-spin" />
                           <p className="urdu-text">استادِ سخن کلام کو پڑھ رہے ہیں...</p>
                        </div>
                      ) : processResult ? (
                        <div className="fade-in whitespace-pre-wrap text-gray-700 leading-relaxed">
                           {Array.isArray(processResult) ? (
                            <ul className="space-y-4">
                              {processResult.map((verse, idx) => (
                                <li key={idx} onClick={() => selectSuggestion(verse)} className="p-4 border border-gray-100 rounded-xl hover:bg-blue-50 cursor-pointer flex justify-between items-center group shadow-sm transition-all">
                                  <span>{idx + 1}. {verse}</span>
                                  <PenTool size={16} className="text-blue-300 opacity-0 group-hover:opacity-100" />
                                </li>
                              ))}
                            </ul>
                           ) : processResult}
                        </div>
                      ) : (
                        <div className="h-full flex items-center justify-center text-gray-300 italic urdu-text">
                           کلام کا تجزیہ یہاں ظاہر ہوگا...
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="md:col-span-4">
                  <div className="bs-callout-urdu bs-callout-urdu-primary main-raised2 h-[600px] flex flex-col p-4">
                    <h5 className="urdu-large font-bold flex items-center gap-2 border-b pb-2 mb-4 text-blue-700">
                      <MessageCircle size={22} /> ادبی مشورہ (Chat)
                    </h5>
                    
                    <div 
                      id="chatWindow"
                      ref={chatWindowRef}
                      className="flex-grow overflow-y-auto bg-[#f4f4f4] rounded-xl p-4 urdu-small mb-4 custom-scroll space-y-4 shadow-inner"
                    >
                      {chatMessages.map((msg, i) => (
                        <div key={i} className={msg.role === 'user' ? 'user-msg' : 'ai-msg'}>
                          <p className="text-[11px] opacity-70 mb-1 font-bold">
                            {msg.role === 'user' ? 'آپ:' : 'استاد:'}
                          </p>
                          <p className={`leading-relaxed ${msg.isError ? 'text-red-500' : ''}`}>{msg.text}</p>
                        </div>
                      ))}
                    </div>

                    <div className="input-group flex gap-2">
                      <input 
                        type="text" 
                        id="chatInput"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                        className="form-control flex-grow p-3 border rounded-xl urdu-small outline-none shadow-sm" 
                        placeholder="یہاں سوال پوچھیں..."
                      />
                      <button 
                        id="sendChat"
                        onClick={handleSendChat}
                        className="btn btn-primary bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 transition-all shadow-md active:scale-95"
                      >
                        <Send size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="footer py-16 px-8 mt-20 text-white">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 text-right">
          <div>
            <h4 className="text-3xl font-bold mb-6">ARUUZ</h4>
            <p className="text-gray-400 naskh-text text-lg leading-relaxed">اردو زبان و ادب کی ڈیجیٹل ترویج کے لیے وقف ایک منفرد پلیٹ فارم۔ جہاں روایت اور ٹیکنالوجی ایک جگہ ملتے ہیں۔</p>
          </div>
          <div className="text-sm text-gray-500 naskh-text self-end">© {new Date().getFullYear()} عروض ڈاٹ کام - جملہ حقوق محفوظ ہیں۔</div>
        </div>
      </footer>

      {showScrollTop && <button onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})} className="fixed bottom-10 left-10 z-[200] bg-aruuz-primary text-white p-4 rounded-full shadow-2xl hover:bg-aruuz-accent transition-all"><ArrowUp size={24} /></button>}
    </>
  );
};

export default App;
