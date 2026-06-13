import { useState, useMemo, useEffect, useCallback } from "react";

// ─── SYNTAX HIGHLIGHTER ───────────────────────────────────────────────────────
const KEYWORDS = new Set([
    "alignas",
    "auto",
    "bool",
    "break",
    "case",
    "catch",
    "char",
    "class",
    "const",
    "constexpr",
    "consteval",
    "constinit",
    "continue",
    "co_await",
    "co_return",
    "co_yield",
    "default",
    "delete",
    "do",
    "double",
    "else",
    "enum",
    "explicit",
    "export",
    "extern",
    "false",
    "final",
    "float",
    "for",
    "friend",
    "goto",
    "if",
    "import",
    "inline",
    "int",
    "long",
    "module",
    "mutable",
    "namespace",
    "new",
    "noexcept",
    "not",
    "nullptr",
    "operator",
    "override",
    "private",
    "protected",
    "public",
    "register",
    "requires",
    "return",
    "short",
    "signed",
    "sizeof",
    "static",
    "static_assert",
    "struct",
    "switch",
    "template",
    "this",
    "thread_local",
    "throw",
    "true",
    "try",
    "typedef",
    "typeid",
    "typename",
    "union",
    "unsigned",
    "using",
    "virtual",
    "void",
    "volatile",
    "wchar_t",
    "while",
    "static_cast",
    "dynamic_cast",
    "reinterpret_cast",
    "const_cast",
    "decltype",
]);

const STL_TYPES = new Set([
    "string",
    "wstring",
    "string_view",
    "string_literal",
    "vector",
    "deque",
    "list",
    "forward_list",
    "array",
    "map",
    "multimap",
    "unordered_map",
    "unordered_multimap",
    "set",
    "multiset",
    "unordered_set",
    "unordered_multiset",
    "stack",
    "queue",
    "priority_queue",
    "pair",
    "tuple",
    "optional",
    "variant",
    "any",
    "expected",
    "unique_ptr",
    "shared_ptr",
    "weak_ptr",
    "enable_shared_from_this",
    "mutex",
    "shared_mutex",
    "recursive_mutex",
    "timed_mutex",
    "lock_guard",
    "unique_lock",
    "shared_lock",
    "scoped_lock",
    "condition_variable",
    "condition_variable_any",
    "atomic",
    "atomic_flag",
    "atomic_int",
    "atomic_bool",
    "thread",
    "jthread",
    "future",
    "promise",
    "packaged_task",
    "async",
    "function",
    "bind_expression",
    "reference_wrapper",
    "initializer_list",
    "span",
    "byte",
    "size_t",
    "ptrdiff_t",
    "nullptr_t",
    "max_align_t",
    "int8_t",
    "int16_t",
    "int32_t",
    "int64_t",
    "uint8_t",
    "uint16_t",
    "uint32_t",
    "uint64_t",
    "INT_MAX",
    "INT_MIN",
    "UINT_MAX",
    "SIZE_MAX",
    "NULL",
    "ios",
    "istream",
    "ostream",
    "iostream",
    "ifstream",
    "ofstream",
    "fstream",
    "istringstream",
    "ostringstream",
    "stringstream",
    "cout",
    "cin",
    "cerr",
    "clog",
    "endl",
    "flush",
    "exception",
    "runtime_error",
    "logic_error",
    "bad_alloc",
    "out_of_range",
    "invalid_argument",
    "overflow_error",
    "domain_error",
    "memory_order_relaxed",
    "memory_order_acquire",
    "memory_order_release",
    "memory_order_seq_cst",
]);

const STL_FUNCS = new Set([
    "make_unique",
    "make_shared",
    "make_pair",
    "make_tuple",
    "make_optional",
    "make_error_code",
    "make_error_condition",
    "shared_from_this",
    "weak_from_this",
]);

const SH = {
    comment: "#6a9955",
    preproc: "#c586c0",
    string: "#ce9178",
    number: "#b5cea8",
    keyword: "#569cd6",
    type: "#4ec9b0",
    func: "#dcdcaa",
    var: "#9cdcfe",
    op: "#c9c9c9",
};

const RULES = [
    { re: /^\/\/[^\n]*/, col: () => SH.comment },
    { re: /^\/\*[\s\S]*?\*\//, col: () => SH.comment },
    { re: /^#[^\n]*/, col: () => SH.preproc },
    { re: /^"(?:\\.|[^"\\])*"|^'(?:\\.|[^'\\])*'/, col: () => SH.string },
    {
        re: /^0x[0-9a-fA-F]+[uUlL]*|^\d+\.?\d*(?:[eE][+-]?\d+)?[fFuUlL]*/,
        col: () => SH.number,
    },
    { re: /^[a-zA-Z_]\w*(?=\s*::)/, col: () => SH.type },
    {
        re: /^[a-zA-Z_]\w*/,
        col: (t, rest) => {
            if (KEYWORDS.has(t)) return SH.keyword;
            if (STL_TYPES.has(t)) return SH.type;
            if (STL_FUNCS.has(t)) return SH.func;
            if (/^[A-Z]/.test(t)) return SH.type;
            const after = rest.slice(t.length);
            if (/^\s*[(<]/.test(after)) return SH.func;
            return SH.var;
        },
    },
    {
        re: /^->|^::|^<<=?|^>>=?|^==|^!=|^<=|^>=|^&&|^\|\||^\+\+|^--|^[+\-*/%&|^~!<>=?:.;,{}()\[\]]/,
        col: () => SH.op,
    },
    { re: /^[ \t\n\r]+/, col: () => null },
    { re: /^./, col: () => SH.op },
];

function tokenize(code) {
    const out = [];
    let s = code;
    while (s.length > 0) {
        let hit = false;
        for (const rule of RULES) {
            const m = s.match(rule.re);
            if (m) {
                const text = m[0];
                const color = rule.col(text, s);
                out.push({ text, color });
                s = s.slice(text.length);
                hit = true;
                break;
            }
        }
        if (!hit) {
            out.push({ text: s[0], color: SH.op });
            s = s.slice(1);
        }
    }
    return out;
}

function splitQuestion(text) {
    const idx = text.indexOf("\n\n");
    if (idx === -1) return { question: text, code: null };
    return { question: text.slice(0, idx), code: text.slice(idx + 2) };
}

function CodeBlock({ code, borderColor }) {
    const tokens = useMemo(() => tokenize(code), [code]);
    return (
        <pre
            style={{
                background: "#010409",
                border: `1px solid ${borderColor || "#21262d"}`,
                borderRadius: "6px",
                padding: "14px",
                margin: 0,
                fontSize: "11px",
                lineHeight: 1.8,
                fontFamily: "'IBM Plex Mono','Fira Code',monospace",
                overflowX: "auto",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
            }}
        >
            {tokens.map((tok, i) =>
                tok.color ? (
                    <span key={i} style={{ color: tok.color }}>
                        {tok.text}
                    </span>
                ) : (
                    tok.text
                ),
            )}
        </pre>
    );
}

// ─── PROGRESS COMPONENTS ──────────────────────────────────────────────────────
function ProgressBar({
    label,
    completed,
    total,
    color = "#e07b39",
    slim = false,
}) {
    const pct = total === 0 ? 0 : Math.round((completed / total) * 100);
    const done = completed === total && total > 0;
    const fill = done ? "#7ec98a" : color;
    return (
        <div>
            {!slim && (
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "11px",
                        marginBottom: "5px",
                    }}
                >
                    <span style={{ color: "#7d8590" }}>{label}</span>
                    <span style={{ color: fill }}>
                        {completed}/{total}
                        {done ? " ✓" : ` (${pct}%)`}
                    </span>
                </div>
            )}
            <div
                style={{
                    height: slim ? 3 : 5,
                    background: "#21262d",
                    borderRadius: "3px",
                    overflow: "hidden",
                }}
            >
                <div
                    style={{
                        height: "100%",
                        width: `${pct}%`,
                        background: fill,
                        borderRadius: "3px",
                        transition: "width 0.35s ease",
                    }}
                />
            </div>
        </div>
    );
}

function Checkbox({ checked, onChange, accent = "#7ec98a" }) {
    return (
        <button
            onClick={(e) => {
                e.stopPropagation();
                onChange(!checked);
            }}
            title={checked ? "Mark incomplete" : "Mark complete"}
            style={{
                width: "18px",
                height: "18px",
                flexShrink: 0,
                border: `1.5px solid ${checked ? accent : "#444c56"}`,
                borderRadius: "4px",
                background: checked ? accent + "28" : "transparent",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 0,
                transition: "border-color 0.15s, background 0.15s",
            }}
        >
            {checked && (
                <span
                    style={{
                        color: accent,
                        fontSize: "11px",
                        lineHeight: 1,
                            fontWeight: 700,
                            fontFamily: "'IBM Plex Mono','Fira Code',monospace",
                    }}
                >
                    ✓
                </span>
            )}
        </button>
    );
}

// ─── WEEK PLAN ────────────────────────────────────────────────────────────────
const weekPlan = [
    {
        week: "Week 1",
        focus: "C++ Language Core",
        color: "#e07b39",
        items: [
            "RAII & resource management",
            "Rule of 3 / 5 / 0 + move semantics",
            "Abstract classes & pure virtual interfaces",
            "Virtual dispatch & vtables",
            "enum class & state modeling",
            "Const correctness & references",
            "Exception safety & noexcept",
        ],
    },
    {
        week: "Week 2",
        focus: "OOP, SOLID & C++ Features",
        color: "#5b9cf6",
        items: [
            "SOLID principles (all 5, with C++ examples)",
            "Composition vs inheritance",
            "std::function & callable objects",
            "Class templates & function templates",
            "Operator overloading",
            "dynamic_cast & RTTI",
            "Multiple inheritance & virtual base classes",
            "Concurrency basics: mutex, lock_guard, atomic",
        ],
    },
    {
        week: "Week 3",
        focus: "Design Patterns",
        color: "#7ec98a",
        items: [
            "Creational: Singleton (thread-safe), Factory, Builder",
            "Structural: Adapter, Decorator, Proxy, Composite",
            "Behavioral: Observer, Strategy, Command, State",
            "Implement each pattern in C++",
            "Identify which pattern solves which LLD problem",
        ],
    },
    {
        week: "Week 4",
        focus: "LLD Problems + Trivia Drill",
        color: "#c084fc",
        items: [
            "Parking Lot System",
            "Elevator / Lift Controller",
            "Chess Game engine",
            "Vending Machine",
            "Library Management System",
            "Daily 10-question trivia drill (cppquiz.org)",
            "Mock interviews: 45 min per LLD problem",
        ],
    },
];

// ─── TOPICS ───────────────────────────────────────────────────────────────────
const coreTopics = [
    {
        title: "RAII & Smart Pointers",
        tag: "Critical",
        tagColor: "#e07b39",
        summary:
            "Resource Acquisition Is Initialization — tie resource lifetime to object lifetime. Smart pointers enforce this automatically. Your default should always be unique_ptr.",
        code: `// RAII: resource tied to object lifetime
class FileHandle {
    FILE* fp;
public:
    explicit FileHandle(const char* path) : fp(fopen(path, "r")) {
        if (!fp) throw std::runtime_error("open failed");
    }
    ~FileHandle() { if (fp) fclose(fp); }
    FileHandle(const FileHandle&) = delete;
    FileHandle& operator=(const FileHandle&) = delete;
};

auto uniq   = std::make_unique<Widget>();   // sole owner, zero overhead
auto shared = std::make_shared<Widget>();   // shared ref-counted ownership
std::weak_ptr<Widget> weak = shared;        // observe without owning (breaks cycles)`,
    },
    {
        title: "Rule of 5 & Move Semantics",
        tag: "Critical",
        tagColor: "#e07b39",
        summary:
            "If you define any of: destructor, copy ctor, copy assign, move ctor, move assign — define all five. Move ops MUST be noexcept for STL containers to use them.",
        code: `class Buffer {
    int* data; size_t size;
public:
    Buffer(size_t n) : data(new int[n]), size(n) {}
    ~Buffer() { delete[] data; }                           // 1. Destructor

    Buffer(const Buffer& o)                                // 2. Copy ctor
        : data(new int[o.size]), size(o.size)
    { std::copy(o.data, o.data + size, data); }

    Buffer& operator=(const Buffer& o) {                   // 3. Copy assign
        if (this != &o) { delete[] data;
            data = new int[o.size]; size = o.size;
            std::copy(o.data, o.data + size, data); }
        return *this;
    }
    Buffer(Buffer&& o) noexcept                            // 4. Move ctor
        : data(o.data), size(o.size)
    { o.data = nullptr; o.size = 0; }

    Buffer& operator=(Buffer&& o) noexcept {               // 5. Move assign
        if (this != &o) { delete[] data;
            data = o.data; size = o.size;
            o.data = nullptr; o.size = 0; }
        return *this;
    }
};`,
    },
    {
        title: "Abstract Classes & Pure Virtual Interfaces",
        tag: "Critical",
        tagColor: "#e07b39",
        summary:
            "The #1 tool in C++ LLD. Define interfaces as pure-virtual base classes. Every design should start here — depend on abstractions, not concretions.",
        code: `class IPaymentProcessor {
public:
    virtual bool charge(double amount) = 0;
    virtual void refund(double amount) = 0;
    virtual ~IPaymentProcessor() = default;  // MUST be virtual!
};

class StripeProcessor : public IPaymentProcessor {
public:
    bool charge(double amount) override { return true; }
    void refund(double amount) override {}
};

// Mixin: implement multiple pure interfaces
class ILogger {
public:
    virtual void log(const std::string& msg) = 0;
    virtual ~ILogger() = default;
};

class PaymentService : public IPaymentProcessor, public ILogger {
public:
    bool charge(double amount) override {
        log("Charging: " + std::to_string(amount)); return true;
    }
    void refund(double amount) override {}
    void log(const std::string& msg) override { std::cout << msg << "\n"; }
};`,
    },
    {
        title: "Virtual Dispatch & Vtables",
        tag: "Critical",
        tagColor: "#e07b39",
        summary:
            "virtual functions dispatch through a vtable pointer hidden in each object. Always use virtual destructor on base classes, use override keyword, and understand slicing risk.",
        code: `class Shape {
public:
    virtual double area() const = 0;
    virtual void draw() const {}
    virtual ~Shape() = default;    // ALWAYS virtual destructor!
};
class Circle : public Shape {
    double r;
public:
    explicit Circle(double r) : r(r) {}
    double area() const override { return 3.14159 * r * r; }
};

// Polymorphic collection
std::vector<std::unique_ptr<Shape>> shapes;
shapes.push_back(std::make_unique<Circle>(5.0));
for (const auto& s : shapes) std::cout << s->area();`,
    },
    {
        title: "enum class & State Modeling",
        tag: "Critical",
        tagColor: "#e07b39",
        summary:
            "State machines appear in nearly every LLD problem. Model states with enum class — scoped, type-safe, no implicit int conversion.",
        code: `enum class VendingState { Idle, HasMoney, Dispensing, OutOfStock };

class VendingMachine {
    VendingState state = VendingState::Idle;
    double balance = 0.0;
public:
    void insertCoin(double amount) {
        if (state != VendingState::Idle)
            throw std::logic_error("Already has money");
        balance += amount;
        state = VendingState::HasMoney;    // transition
    }
    void selectItem(int itemId) {
        if (state != VendingState::HasMoney)
            throw std::logic_error("Insert coin first");
        state = VendingState::Dispensing;
        dispense(itemId);
        balance = 0; state = VendingState::Idle;
    }
    VendingState getState() const { return state; }
private:
    void dispense(int id) { /* dispense logic */ }
};`,
    },
    {
        title: "SOLID Principles",
        tag: "Critical",
        tagColor: "#e07b39",
        summary:
            "Interviewers probe these explicitly. DIP (Dependency Inversion) is the most important for LLD — depend on interfaces, not concretions.",
        code: `class ILogger {
public:
    virtual void log(const std::string& msg) = 0;
    virtual ~ILogger() = default;
};

// SRP: UserService handles users; logging is injected (DIP)
class UserService {
    std::shared_ptr<ILogger> logger_;
public:
    explicit UserService(std::shared_ptr<ILogger> l) : logger_(l) {}
    void createUser(const std::string& name) {
        logger_->log("Created user: " + name);
    }
};

// OCP: extend with new discount types, never modify existing classes
class IDiscountStrategy { public: virtual double apply(double p) = 0; };
class NoDiscount     : public IDiscountStrategy { double apply(double p) override { return p; } };
class TenPercentOff  : public IDiscountStrategy { double apply(double p) override { return p * 0.9; } };`,
    },
    {
        title: "std::function & Callable Objects",
        tag: "High",
        tagColor: "#5b9cf6",
        summary:
            "std::function stores any callable with a uniform interface. Essential for Observer, Strategy, and callbacks without tight coupling.",
        code: `class Button {
    std::function<void()> onClick_;
public:
    void setHandler(std::function<void()> h) { onClick_ = std::move(h); }
    void click() { if (onClick_) onClick_(); }
};

// Strategy pattern — no virtual dispatch needed for simple cases
class Sorter {
    std::function<bool(int, int)> cmp_;
public:
    explicit Sorter(std::function<bool(int,int)> c) : cmp_(std::move(c)) {}
    void sort(std::vector<int>& v) { std::sort(v.begin(), v.end(), cmp_); }
};

Sorter asc([](int a, int b)  { return a < b; });
Sorter desc([](int a, int b) { return a > b; });`,
    },
    {
        title: "Exception Safety & noexcept",
        tag: "High",
        tagColor: "#5b9cf6",
        summary:
            "Three levels: no-throw (noexcept), strong guarantee, basic guarantee. Mark move ops noexcept — STL containers depend on it for efficient reallocation.",
        code: `class MyObj {
public:
    MyObj(MyObj&& o) noexcept : data(o.data) { o.data = nullptr; }
    MyObj& operator=(MyObj&& o) noexcept {
        delete data; data = o.data; o.data = nullptr; return *this;
    }
private: int* data = nullptr;
};

// Strong guarantee: copy-and-swap idiom
class Config {
    std::map<std::string, std::string> data_;
public:
    void update(std::map<std::string, std::string> newData) {
        data_.swap(newData);  // noexcept; old data destroyed in newData
    }
};

// Verify at compile time
static_assert(std::is_nothrow_move_constructible_v<MyObj>);`,
    },
    {
        title: "Class Templates",
        tag: "High",
        tagColor: "#5b9cf6",
        summary:
            "Templates enable generic, type-safe containers and policies. Used for generic wrappers, caches, and policy-based design.",
        code: `template<typename T>
class Result {
    T value_; std::string error_; bool ok_ = false;
public:
    static Result<T> success(T v) {
        Result r; r.value_ = std::move(v); r.ok_ = true; return r;
    }
    static Result<T> failure(std::string e) {
        Result r; r.error_ = std::move(e); return r;
    }
    bool isOk() const { return ok_; }
    T&   value()      { return value_; }
};

template<typename K, typename V>
class Cache {
    std::unordered_map<K, V> store_;
    mutable std::mutex mtx_;
public:
    void put(const K& k, const V& v) {
        std::lock_guard lock(mtx_); store_[k] = v;
    }
    std::optional<V> get(const K& k) const {
        std::lock_guard lock(mtx_);
        auto it = store_.find(k);
        return it == store_.end() ? std::nullopt : std::optional<V>{it->second};
    }
};`,
    },
    {
        title: "Operator Overloading",
        tag: "High",
        tagColor: "#5b9cf6",
        summary:
            "Makes value types natural to use. In LLD, relevant for Money, Position (Chess), Duration. Rule: if you overload ==, also overload != and <.",
        code: `class Money {
    int cents_; std::string currency_;
public:
    explicit Money(int cents, std::string cur = "USD")
        : cents_(cents), currency_(std::move(cur)) {}

    Money operator+(const Money& o) const { return Money(cents_ + o.cents_, currency_); }
    Money operator-(const Money& o) const { return Money(cents_ - o.cents_, currency_); }
    bool  operator==(const Money& o) const { return cents_ == o.cents_ && currency_ == o.currency_; }
    bool  operator<(const Money& o)  const { return cents_ < o.cents_; }

    friend std::ostream& operator<<(std::ostream& os, const Money& m) {
        return os << "$" << m.cents_/100 << "." << m.cents_%100;
    }
};`,
    },
    {
        title: "Lambdas & Closures",
        tag: "High",
        tagColor: "#5b9cf6",
        summary:
            "Understand capture modes: [=] copies, [&] references (beware dangling!). Explicit captures are preferred. Combine with std::function and STL algorithms.",
        code: `int threshold = 10;
auto overLimit = [threshold](int x) { return x > threshold; };  // copy capture
auto setLimit  = [&threshold](int x) { threshold = x; };        // ref capture — careful!

// Generic lambda (C++14)
auto print = [](const auto& x) { std::cout << x << "\n"; };

// LLD usage: filter available parking spots
std::vector<std::shared_ptr<Vehicle>> available;
std::copy_if(vehicles.begin(), vehicles.end(),
             std::back_inserter(available),
             [](const auto& v) { return v->isAvailable(); });`,
    },
    {
        title: "dynamic_cast & RTTI",
        tag: "Medium",
        tagColor: "#7ec98a",
        summary:
            "Safe downcast in a polymorphic hierarchy. Returns nullptr (pointer) if cast fails. Use sparingly — frequent use signals a missing virtual method in the base class.",
        code: `class Vehicle { public: virtual ~Vehicle() = default; };
class Car   : public Vehicle { public: void honk() {} };
class Truck : public Vehicle { public: void loadCargo() {} };

void process(Vehicle* v) {
    if (auto* car = dynamic_cast<Car*>(v))      { car->honk(); }
    else if (auto* t = dynamic_cast<Truck*>(v)) { t->loadCargo(); }
    // Prefer: add virtual dispatch(Visitor&) to Vehicle instead
}`,
    },
    {
        title: "Multiple Inheritance & Virtual Base Classes",
        tag: "Medium",
        tagColor: "#7ec98a",
        summary:
            "Most common use: implement multiple pure interfaces (mixin). Diamond problem arises with shared data ancestors — solve with virtual inheritance.",
        code: `class IDrawable  { public: virtual void draw()  = 0; virtual ~IDrawable()  = default; };
class IClickable { public: virtual void click() = 0; virtual ~IClickable() = default; };

class Button : public IDrawable, public IClickable {
public:
    void draw()  override { /* render */ }
    void click() override { /* handle */ }
};

// Diamond problem — virtual inheritance gives exactly one base copy
class Logger     { public: int level = 0; };
class FileLog    : virtual public Logger {};
class ConsoleLog : virtual public Logger {};
class DualLog    : public FileLog, public ConsoleLog {};
// Without virtual: DualLog::level is ambiguous (two copies exist)`,
    },
    {
        title: "Concurrency Basics",
        tag: "Medium",
        tagColor: "#7ec98a",
        summary:
            "Interviewers often ask 'how would you make this thread-safe?'. Know mutex + lock_guard for shared state, atomic for counters, and reader-writer lock for read-heavy workloads.",
        code: `class ThreadSafeQueue {
    std::queue<int> q_; mutable std::mutex mtx_;
public:
    void push(int v) { std::lock_guard<std::mutex> lock(mtx_); q_.push(v); }
    std::optional<int> pop() {
        std::lock_guard<std::mutex> lock(mtx_);
        if (q_.empty()) return std::nullopt;
        int v = q_.front(); q_.pop(); return v;
    }
};

std::atomic<int> hits{0};
hits.fetch_add(1, std::memory_order_relaxed);  // lock-free counter

class RWCache {   // many readers OR one writer (C++17)
    std::unordered_map<std::string, std::string> cache_;
    mutable std::shared_mutex rwMtx_;
public:
    std::string get(const std::string& k) const {
        std::shared_lock lock(rwMtx_); return cache_.count(k) ? cache_.at(k) : "";
    }
    void set(const std::string& k, const std::string& v) {
        std::unique_lock lock(rwMtx_); cache_[k] = v;
    }
};`,
    },
    {
        title: "std::optional & Type Safety",
        tag: "Medium",
        tagColor: "#7ec98a",
        summary:
            "Use optional instead of nullptr or sentinel values to express 'value or nothing'. Makes APIs self-documenting and eliminates null-dereference bugs.",
        code: `class ParkingLot {
    std::vector<ParkingSpot> spots_;
public:
    std::optional<ParkingSpot> findAvailableSpot(VehicleType type) {
        for (auto& spot : spots_)
            if (spot.isAvailable() && spot.fits(type)) return spot;
        return std::nullopt;
    }
};

auto spot = lot.findAvailableSpot(VehicleType::Car);
if (spot.has_value()) {
    spot->reserve();
} else {
    std::cout << "Lot is full\n";
}

auto user = getUser(id).value_or(User{"Guest"});`,
    },
];

// ─── TRIVIA ───────────────────────────────────────────────────────────────────
const triviaCategories = [
    {
        name: "Undefined Behavior",
        color: "#ef4444",
        icon: "☠",
        desc: "The most common trivia category. UB means the compiler can do anything — crash, silently corrupt data, or appear to work.",
        questions: [
            {
                tag: "Signed overflow",
                q: "What does this print?\n\nint x = INT_MAX;\nx++;\nstd::cout << x;",
                a: "Undefined Behavior. Signed integer overflow is UB in C++ — the result is not guaranteed to wrap. The compiler may assume overflow never happens and optimize accordingly.\n\nFix: use unsigned int (defined wrapping), or check before incrementing.",
            },
            {
                tag: "Evaluation order",
                q: "What does this print?\n\nint i = 0;\nstd::cout << i++ << i++;",
                a: "Undefined Behavior (pre-C++17). The order of evaluation of << operands is unspecified — i could be incremented in any order.\n\nIn C++17, right-hand operand of << is sequenced after the left, so it prints '01'. Still — avoid this pattern entirely.",
            },
            {
                tag: "Out-of-bounds",
                q: "Is this safe?\n\nint arr[5] = {1, 2, 3, 4, 5};\nint* p = arr + 5;  // one-past-end\n*p = 10;",
                a: "No — Undefined Behavior. A pointer to one-past-the-end is valid to form and compare, but dereferencing it is UB.\n\n  int* p = arr + 5;  // OK to hold\n  *p = 10;           // UB — dereference!",
            },
            {
                tag: "Use after free",
                q: "What is wrong here?\n\nint* p = new int(42);\ndelete p;\nstd::cout << *p;",
                a: "Use-after-free — Undefined Behavior. After delete, memory may be returned to the OS or reused. Dereferencing p is UB even if it appears to work.\n\nFix: p = nullptr after delete, or use unique_ptr which makes this impossible.",
            },
            {
                tag: "Uninitialized read",
                q: "What does this print?\n\nint x;\nstd::cout << x;",
                a: "Undefined Behavior. Reading an uninitialized local variable is UB — the 'value' could be anything, or the compiler may optimize the read away.\n\nFix: always initialize:\n  int x = 0;  or  int x{};",
            },
        ],
    },
    {
        name: "Object Lifecycle",
        color: "#f97316",
        icon: "⟳",
        desc: "Construction order, destruction order, virtual dispatch during construction — classic interview trap territory.",
        questions: [
            {
                tag: "Virtual in ctor",
                q: 'What does this print?\n\nclass Base {\npublic:\n    Base() { foo(); }\n    virtual void foo() { std::cout << "Base\\n"; }\n};\nclass Derived : public Base {\npublic:\n    void foo() override { std::cout << "Derived\\n"; }\n};\nDerived d;',
                a: "Prints: Base\n\nVirtual dispatch does NOT work during construction or destruction. When Base::Base() runs, the Derived part hasn't been constructed yet — the vtable still points to Base::foo.\n\nRule: never call virtual functions in constructors or destructors.",
            },
            {
                tag: "Init list order",
                q: "What is the member initialization order?\n\nclass Foo {\n    int b;\n    int a;\npublic:\n    Foo() : a(5), b(a + 1) {}\n};",
                a: "b is initialized BEFORE a — because members are initialized in the ORDER DECLARED IN THE CLASS, not the order in the initializer list.\n\nResult: b = (uninitialized a) + 1 → Undefined Behavior. a = 5.\n\nFix: reorder the declaration, or don't use one member to initialize another.",
            },
            {
                tag: "Non-virtual dtor",
                q: "What happens here?\n\nclass Base { /* no virtual destructor */ };\nclass Derived : public Base {\n    ~Derived() { cleanup(); }\n};\nBase* p = new Derived();\ndelete p;",
                a: "Undefined Behavior. Without a virtual destructor, delete p only calls Base::~Base — Derived::~Derived is never called. Resources held by Derived are leaked.\n\nRule: any base class with virtual functions must have a virtual destructor.",
            },
            {
                tag: "Object slicing",
                q: "What happens?\n\nstruct Base { int x = 1; virtual void f() {} };\nstruct Derived : Base { int y = 2; void f() override {} };\n\nDerived d;\nBase b = d;   // copy by value\nb.f();",
                a: "Object slicing. Copying a Derived into a Base by value slices off the Derived-specific data (y) and vtable. b.f() calls Base::f, not Derived::f.\n\nFix: always use pointers or references for polymorphism:\n  Base& ref = d;  // no slicing\n  ref.f();        // calls Derived::f",
            },
            {
                tag: "Destructor order",
                q: "In what order are destructors called?\n\nstruct A { ~A() { std::cout << 'A'; } };\nstruct B : A { ~B() { std::cout << 'B'; } };\nstruct C : B { ~C() { std::cout << 'C'; } };\n\nC obj;",
                a: "Prints: CBA\n\nDestructors run in REVERSE construction order:\n  Constructed: A → B → C\n  Destructed:  C → B → A\n\nSame applies to member variables: destroyed in reverse declaration order.",
            },
        ],
    },
    {
        name: "Const & Pointer Rules",
        color: "#e07b39",
        icon: "◎",
        desc: "East-west const, pointer-to-const vs const-pointer, and const reference lifetime extension — classic exam material.",
        questions: [
            {
                tag: "East/west const",
                q: "What is the difference?\n\nconst int* p1;\nint* const p2 = &x;\nconst int* const p3 = &x;",
                a: "Read right-to-left:\n\n  const int* p1       → pointer to const int\n                        (can change p1, cannot change *p1)\n\n  int* const p2       → const pointer to int\n                        (cannot change p2, can change *p2)\n\n  const int* const p3 → const pointer to const int\n                        (cannot change either)",
            },
            {
                tag: "Dangling reference",
                q: 'Does this compile? Is it safe?\n\nconst std::string& greet() {\n    std::string s = "hello";\n    return s;\n}',
                a: 'Compiles (with a warning) but is NOT safe — Undefined Behavior. s is a local variable destroyed when greet() returns. The caller gets a dangling reference.\n\nFix: return by value:\n  std::string greet() { return "hello"; }',
            },
            {
                tag: "Temp lifetime",
                q: 'How long does the temporary live?\n\nconst std::string& r = std::string("hello");\nstd::cout << r;   // safe?',
                a: "Safe. Binding a temporary to a const lvalue reference extends its lifetime to match the reference.\n\nThis does NOT work for:\n  - Non-const references\n  - References inside class members\n  - Returned references\n\nOnly works for local const references directly bound to a temporary.",
            },
            {
                tag: "std::move",
                q: 'What does std::move actually do?\n\nstd::string s = "hello";\nstd::string t = std::move(s);\n// what is s now?',
                a: "std::move is just a cast to rvalue reference — it doesn't move anything itself. The actual move happens in t's move constructor.\n\nAfter the move, s is in a valid but unspecified state — typically empty for std::string. Do not use its value; you may safely re-assign it.",
            },
            {
                tag: "Move from const",
                q: 'Does std::move on const actually move?\n\nconst std::string s = "hello";\nstd::string t = std::move(s);',
                a: "No — it copies. std::move(s) produces a const rvalue reference. No move constructor accepts const&& (that would modify const), so overload resolution falls back to the copy constructor.\n\nRule: moving from const is always a copy.",
            },
        ],
    },
    {
        name: "Move Semantics Edge Cases",
        color: "#eab308",
        icon: "⇒",
        desc: "Named rvalue refs, forwarding, and moved-from state — subtle rules that trip up experienced developers.",
        questions: [
            {
                tag: "Named rvalue ref",
                q: "Is x an lvalue or rvalue here?\n\nvoid foo(std::string&& x) {\n    std::string y = x;  // move or copy?\n}",
                a: "x is an LVALUE inside foo's body — even though it's declared as rvalue reference. Named variables are always lvalues regardless of their declared type.\n\nSo std::string y = x is a COPY.\n\nTo actually move: std::string y = std::move(x);",
            },
            {
                tag: "Moved-from state",
                q: 'What is wrong here?\n\nstd::vector<std::string> v;\nstd::string s = "hello";\nv.push_back(std::move(s));\nstd::cout << s;  // what is s?',
                a: "s is in a valid but unspecified state after being moved from. For std::string this is typically empty, but the standard only guarantees the object is valid (destructable, assignable) — not that it's empty.\n\nRule: do not use a moved-from object's value. You may re-assign it safely.",
            },
            {
                tag: "noexcept + vector",
                q: "When does std::vector use move vs copy during reallocation?",
                a: "std::vector uses move during reallocation ONLY IF the element's move constructor is noexcept. If not, it falls back to copy — because it needs the strong exception guarantee.\n\nThis is why: always mark move constructors noexcept:\n  MyClass(MyClass&&) noexcept { ... }",
            },
        ],
    },
    {
        name: "Initialization Gotchas",
        color: "#a78bfa",
        icon: "⚙",
        desc: "The most vexing parse, static initialization order fiasco, and member init order — classic trivia staples.",
        questions: [
            {
                tag: "Most vexing parse",
                q: "What does this declare?\n\nWidget w();",
                a: "A function named w that takes no arguments and returns a Widget — NOT a Widget object!\n\nThe compiler always prefers a function declaration when syntax is ambiguous.\n\nFix:\n  Widget w{};     // value-initializes (preferred, C++11)\n  Widget w = {};  // also works",
            },
            {
                tag: "Static init fiasco",
                q: "What is the static initialization order fiasco?\n\n// file_a.cpp\nint x = 10;\n\n// file_b.cpp\nextern int x;\nint y = x + 1;",
                a: "y might be 1 or 11 — it depends on which translation unit initializes first, and the C++ standard does not define this order across TUs.\n\nFix options:\n1. Wrap in a function (local statics are safe in C++11+):\n   int& getX() { static int x = 10; return x; }\n\n2. Use constexpr if the value is compile-time constant.",
            },
            {
                tag: "Init types",
                q: "What is the difference?\n\nint a;     // (1)\nint b{};   // (2)\nint c = 0; // (3)",
                a: "(1) int a — default initialization.\n     Local variable: indeterminate (UB to read).\n     Static/global: zero-initialized.\n\n(2) int b{} — value initialization = zero-initialized to 0. Safe everywhere.\n\n(3) int c = 0 — copy initialization. Also 0.\n\nPrefer (2) with braces — explicit, works for all types, prevents narrowing.",
            },
            {
                tag: "Narrowing",
                q: "Does this compile?\n\nvoid foo() {\n    int x = 3.7;  // narrowing?\n    int y{3.7};   // narrowing?\n}",
                a: "int x = 3.7  — compiles (may warn). Value silently truncated to 3.\n\nint y{3.7}   — compile ERROR. Brace initialization forbids narrowing conversions.\n\nThis is one of the main advantages of uniform initialization {}.",
            },
        ],
    },
    {
        name: "Smart Pointer Gotchas",
        color: "#5b9cf6",
        icon: "⬡",
        desc: "shared_ptr pitfalls, cycles, and enable_shared_from_this — frequently asked when discussing RAII and ownership.",
        questions: [
            {
                tag: "Double ref-count",
                q: "What is wrong?\n\nFoo* raw = new Foo();\nstd::shared_ptr<Foo> p1(raw);\nstd::shared_ptr<Foo> p2(raw);",
                a: "Double-free. p1 and p2 each create their own reference count starting at 1. When both go out of scope, they both try to delete raw — Undefined Behavior.\n\nFix: always create shared_ptr via make_shared, or from another shared_ptr:\n  auto p1 = std::make_shared<Foo>();\n  auto p2 = p1;  // shares the same ref count",
            },
            {
                tag: "Cycle / leak",
                q: "What is wrong?\n\nstruct A { std::shared_ptr<B> b; };\nstruct B { std::shared_ptr<A> a; };\n\nauto x = std::make_shared<A>();\nauto y = std::make_shared<B>();\nx->b = y;  y->a = x;",
                a: "Cyclic reference — memory leak. x holds a ref to y, y holds a ref to x. Reference count never reaches 0, so neither A nor B is ever destroyed.\n\nFix: break the cycle with weak_ptr:\n  struct B { std::weak_ptr<A> a; };\n\nweak_ptr doesn't increase the ref count.",
            },
            {
                tag: "shared_from_this",
                q: "How do you safely return shared_ptr<this>?",
                a: "Use std::enable_shared_from_this:\n\n  class Foo : public std::enable_shared_from_this<Foo> {\n  public:\n      std::shared_ptr<Foo> getPtr() {\n          return shared_from_this();  // safe\n      }\n  };\n\nNEVER: return std::shared_ptr<Foo>(this)\n  → creates a new ref count → double-free.",
            },
        ],
    },
    {
        name: "Memory Layout & Sizing",
        color: "#7ec98a",
        icon: "▦",
        desc: "sizeof, struct padding, alignment, virtual pointer overhead — useful for both trivia and systems discussions.",
        questions: [
            {
                tag: "Struct padding",
                q: "What is sizeof(S)?\n\nstruct S {\n    char c;   // 1 byte\n    int  i;   // 4 bytes\n    char d;   // 1 byte\n};",
                a: "12 bytes on most 64-bit platforms, not 6.\n\nLayout after padding:\n  char c    → 1 byte\n  [padding] → 3 bytes (align int to 4)\n  int  i    → 4 bytes\n  char d    → 1 byte\n  [padding] → 3 bytes (struct size must be multiple of max alignment)\n\nFix to minimize padding:\n  struct S { int i; char c; char d; };  // → 8 bytes",
            },
            {
                tag: "vptr overhead",
                q: "How does a virtual function affect sizeof?\n\nstruct A { int x; };\nstruct B { int x; virtual void f(); };",
                a: "sizeof(A) = 4  (just int x)\nsizeof(B) = 16 on 64-bit  (int x + vptr + padding)\n\nEvery class with virtual functions stores a hidden vptr (8 bytes on 64-bit). This is why you should not add virtual to classes that don't need polymorphism.",
            },
            {
                tag: "Container sizeof",
                q: "What is sizeof(std::vector<int>)?",
                a: "Usually 24 bytes on 64-bit systems (3 pointers: begin, end, capacity-end), regardless of how many elements are in the vector.\n\nThe elements live on the heap — sizeof only measures the object itself, not its heap allocation.",
            },
        ],
    },
    {
        name: "STL & Iterator Gotchas",
        color: "#2dd4bf",
        icon: "⋮",
        desc: "Iterator invalidation is the #1 STL gotcha. Know which containers invalidate iterators and when.",
        questions: [
            {
                tag: "Iterator invalidation",
                q: "Is this loop safe?\n\nstd::vector<int> v = {1, 2, 3};\nfor (auto it = v.begin(); it != v.end(); ++it) {\n    if (*it == 2) v.push_back(99);\n}",
                a: "Undefined Behavior. std::vector::push_back may reallocate the buffer if capacity is exceeded — this invalidates ALL existing iterators, pointers, and references.\n\nFix: reserve() capacity upfront, or collect elements to add and push_back after the loop.",
            },
            {
                tag: "Erase-remove",
                q: "What is the erase-remove idiom?\n\nstd::vector<int> v = {1, 2, 3, 2, 4};\n// remove all 2s",
                a: "v.erase(std::remove(v.begin(), v.end(), 2), v.end());\n\nstd::remove shuffles non-matching elements forward and returns an iterator to the new logical end — it does NOT resize. v.erase then removes the tail.\n\nC++20 shorthand: std::erase(v, 2);",
            },
            {
                tag: "map vs unordered_map",
                q: "What is the difference between std::map and std::unordered_map?",
                a: "std::map:\n  - Red-black tree; keys always sorted\n  - O(log n) find/insert/erase\n  - Iterators valid after insert\n  - Requires operator< on key\n\nstd::unordered_map:\n  - Hash table\n  - O(1) average find/insert/erase\n  - Rehash invalidates all iterators\n  - Requires std::hash<Key>\n\nDefault: unordered_map unless you need ordering.",
            },
            {
                tag: "vector<bool> special case",
                q: "Is std::vector<bool> a normal sequence container?\n\nstd::vector<bool> v = {true, false, true};\nauto b = v[0];   // type of b?",
                a: "No — vector<bool> is a TEMPLATE SPECIALIZATION that packs bits (1 bit per bool). This means:\n  - operator[] returns a PROXY OBJECT, not bool&\n  - auto b = v[0] gives you the proxy, not a bool\n  - It's not a proper Sequence container (iterators differ)\n\nPrefer std::vector<char> or std::deque<bool> if you need standard container behavior.",
            },
            {
                tag: "std::string SSO",
                q: "What is Small String Optimization (SSO) and how does it affect moving std::string?",
                a: "Many std::string implementations store short strings (typically ≤15 chars) directly inside the string object on the stack, without heap allocation.\n\nThis means:\n  - sizeof(std::string) ≈ 24–32 bytes to accommodate the buffer\n  - Short strings construct and copy without heap allocation\n  - Moving a SHORT string may involve copying (not O(1)) because the buffer is inline, not a pointer to swap",
            },
        ],
    },
    {
        name: "Templates & Type Deduction",
        color: "#fb923c",
        icon: "◱",
        desc: "auto strips references and const, universal references vs rvalue refs, and template array decay — subtle deduction rules that cause real bugs.",
        questions: [
            {
                tag: "auto strips qualifiers",
                q: "What is the type of y and z?\n\nconst int x = 5;\nauto  y = x;\nauto& z = x;",
                a: "y is int — not const int. auto deduces the type by stripping top-level const and references.\nz is const int& — adding & to auto preserves constness.\n\nRule: auto always decays. Use const auto or auto& to preserve qualifiers.",
            },
            {
                tag: "Universal reference",
                q: "Is T&& a universal reference or rvalue reference?\n\ntemplate<typename T>\nvoid foo(T&& arg);  // (1)\n\nvoid bar(int&& arg); // (2)",
                a: "(1) UNIVERSAL (forwarding) reference — T is a deduced template parameter. Binds to lvalues (T deduces as int&) AND rvalues (T deduces as int).\n\n(2) RVALUE REFERENCE — int is fixed, not deduced. Only binds to rvalues.\n\nRule: T&& is universal only when T is a deduced template parameter.",
            },
            {
                tag: "Array decay in templates",
                q: "What does T deduce to?\n\ntemplate<typename T>\nvoid foo(T arg);\n\nint arr[5] = {1,2,3,4,5};\nfoo(arr);",
                a: "T deduces to int*, not int[5]. Arrays decay to pointers during template deduction when passed by value.\n\nTo preserve the array type:\n  template<typename T, size_t N>\n  void foo(T (&arg)[N]);  // T=int, N=5",
            },
            {
                tag: "decltype vs auto",
                q: "What is the difference in return type?\n\nint x = 5; int& r = x;\nauto        a = r;  // type?\ndecltype(auto) b = r;  // type?",
                a: "auto a = r        → int. auto strips the reference, producing a copy.\ndecltype(auto) b = r → int&. decltype preserves the exact declared type including references.\n\nUse decltype(auto) for return types when you need perfect forwarding of the return value.",
            },
        ],
    },
    {
        name: "Inheritance Gotchas",
        color: "#f472b6",
        icon: "⊲",
        desc: "Name hiding, default arguments in virtual functions, and covariant returns — subtle inheritance rules that produce wrong results without a compile error.",
        questions: [
            {
                tag: "Name hiding",
                q: "Does this compile?\n\nclass Base {\npublic:\n    void foo(int x) {}\n};\nclass Derived : public Base {\npublic:\n    void foo() {}\n};\nDerived d;\nd.foo(42);",
                a: "NO — compile error. Derived::foo() HIDES Base::foo(int) entirely, even though the signatures differ. This is name hiding, not overloading.\n\nFix: add using Base::foo; inside Derived to bring the base overloads back into scope.",
            },
            {
                tag: "Virtual + default args",
                q: 'What does this print?\n\nstruct Base {\n    virtual void f(int x = 1) {\n        std::cout << "B:" << x;\n    }\n};\nstruct Derived : Base {\n    void f(int x = 2) override {\n        std::cout << "D:" << x;\n    }\n};\nBase* p = new Derived();\np->f();',
                a: "Prints: D:1\n\nThe function dispatched is Derived::f (runtime vtable). The default argument used is Base's x=1 (compile-time static binding based on the pointer's static type).\n\nDefault argument values are STATICALLY bound, not dynamically. Avoid redefining defaults in overrides.",
            },
            {
                tag: "Covariant return types",
                q: "Is this override valid?\n\nclass Animal {\npublic:\n    virtual Animal* clone() = 0;\n};\nclass Dog : public Animal {\npublic:\n    Dog* clone() override { return new Dog(); }\n};",
                a: "Yes — valid and correct. C++ allows covariant return types: an override can return a pointer-to-derived when the base returns pointer-to-base, because Dog* is implicitly convertible to Animal*.\n\nOnly works for pointers and references, not value types.",
            },
        ],
    },
];

// ─── PATTERNS ─────────────────────────────────────────────────────────────────
const patterns = [
    {
        category: "Creational",
        color: "#e07b39",
        icon: "◈",
        items: [
            {
                name: "Singleton (Thread-Safe)",
                when: "Exactly one instance needed (config, logger)",
                code: `class Config {
    Config() = default;
public:
    static Config& instance() {
        static Config inst;  // C++11: thread-safe local static
        return inst;
    }
    Config(const Config&) = delete;
    Config& operator=(const Config&) = delete;
};`,
            },
            {
                name: "Factory Method",
                when: "Subclasses decide which class to instantiate",
                code: `class Button { public: virtual void render() = 0; virtual ~Button() = default; };
class WindowsButton : public Button { public: void render() override {} };
class MacButton     : public Button { public: void render() override {} };

class Dialog {
public:
    virtual std::unique_ptr<Button> createButton() = 0;
    void renderUI() { auto btn = createButton(); btn->render(); }
};`,
            },
            {
                name: "Builder",
                when: "Complex object with many optional parameters",
                code: `class QueryBuilder {
    std::string table_, where_, limit_;
public:
    QueryBuilder& from(std::string t)  { table_ = std::move(t); return *this; }
    QueryBuilder& where(std::string w) { where_ = std::move(w); return *this; }
    QueryBuilder& limit(std::string l) { limit_ = std::move(l); return *this; }
    std::string build() const {
        return "SELECT * FROM " + table_ + " WHERE " + where_;
    }
};`,
            },
        ],
    },
    {
        category: "Behavioral",
        color: "#5b9cf6",
        icon: "◇",
        items: [
            {
                name: "Observer",
                when: "One-to-many notification (event bus, pub/sub)",
                code: `class IObserver {
public:
    virtual void onEvent(const std::string& event) = 0;
    virtual ~IObserver() = default;
};
class EventBus {
    std::vector<IObserver*> observers_;
public:
    void subscribe(IObserver* o) { observers_.push_back(o); }
    void publish(const std::string& e) {
        for (auto* o : observers_) o->onEvent(e);
    }
};`,
            },
            {
                name: "Strategy",
                when: "Interchangeable algorithms (sort, pricing, routing)",
                code: `class ISortStrategy {
public:
    virtual void sort(std::vector<int>&) = 0;
    virtual ~ISortStrategy() = default;
};
class Sorter {
    std::unique_ptr<ISortStrategy> strategy_;
public:
    void setStrategy(std::unique_ptr<ISortStrategy> s) { strategy_ = std::move(s); }
    void sort(std::vector<int>& v) { strategy_->sort(v); }
};`,
            },
            {
                name: "State",
                when: "Object behaviour changes based on internal state (ATM, vending)",
                code: `class ATM;
class IATMState {
public:
    virtual void insertCard(ATM&)    = 0;
    virtual void enterPIN(ATM&, int) = 0;
    virtual void withdraw(ATM&, int) = 0;
    virtual ~IATMState() = default;
};
class IdleState : public IATMState {
    void insertCard(ATM& atm) override;   // transition to HasCardState
    void enterPIN(ATM&, int) override  {} // error: no card inserted
    void withdraw(ATM&, int) override  {} // error: no card inserted
};`,
            },
            {
                name: "Decorator",
                when: "Add behaviour at runtime without subclassing",
                code: `class IStream { public: virtual std::string read() = 0; virtual ~IStream() = default; };
class FileStream : public IStream {
public: std::string read() override { return "raw"; }
};
class EncryptedStream : public IStream {
    std::unique_ptr<IStream> inner_;
public:
    explicit EncryptedStream(std::unique_ptr<IStream> s) : inner_(std::move(s)) {}
    std::string read() override { return encrypt(inner_->read()); }
private: std::string encrypt(const std::string& s) { return s; }
};`,
            },
        ],
    },
];

// ─── LLD PROBLEMS ─────────────────────────────────────────────────────────────
const lldProblems = [
    {
        name: "Parking Lot",
        difficulty: "Easy",
        concepts: ["Inheritance", "Factory", "Strategy", "State"],
        entitiesHint:
            "ParkingLot, ParkingFloor, ParkingSpot (Compact/Large/EV), Vehicle, Ticket, PaymentStrategy",
        tip: "Focus on spot allocation strategy and payment polymorphism.",
    },
    {
        name: "Elevator System",
        difficulty: "Medium",
        concepts: ["State", "Strategy", "Observer"],
        entitiesHint:
            "ElevatorController, Elevator, Request, DispatchAlgorithm (SCAN/FCFS), Door",
        tip: "The dispatch algorithm is the crux — make it swappable via Strategy.",
    },
    {
        name: "Chess Game",
        difficulty: "Medium",
        concepts: ["Inheritance", "Composite", "Command", "Observer"],
        entitiesHint:
            "Board, Piece (King/Queen/Rook/Bishop/Knight/Pawn), Move, Player, GameState",
        tip: "Piece::isValidMove() is polymorphic; Command pattern enables undo.",
    },
    {
        name: "Vending Machine",
        difficulty: "Easy",
        concepts: ["State", "Strategy", "Singleton"],
        entitiesHint:
            "VendingMachine, State (Idle/HasMoney/Dispensing), Item, CoinProcessor",
        tip: "State pattern is the clearest fit — model each machine state explicitly with enum class.",
    },
    {
        name: "Library Management",
        difficulty: "Medium",
        concepts: ["Observer", "Factory", "Iterator"],
        entitiesHint:
            "Library, Book, BookItem, Member, Librarian, Reservation, FineCalculator",
        tip: "Distinguish Book (ISBN, title) from BookItem (physical copy with barcode).",
    },
    {
        name: "ATM Machine",
        difficulty: "Hard",
        concepts: ["State", "Chain of Responsibility", "Singleton"],
        entitiesHint:
            "ATM, Card, Account, TransactionState, CashDispenser, ReceiptPrinter",
        tip: "Model the transaction as a state machine: Idle→Authenticated→Transacting→Complete.",
    },
];

// ─── RESOURCES ────────────────────────────────────────────────────────────────
const resources = [
    {
        category: "C++ Reference",
        color: "#e07b39",
        links: [
            {
                name: "cppreference.com",
                url: "https://en.cppreference.com",
                desc: "The definitive C++ language/STL reference",
            },
            {
                name: "C++ Core Guidelines",
                url: "https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines",
                desc: "Bjarne Stroustrup's official best practices",
            },
            {
                name: "learncpp.com",
                url: "https://www.learncpp.com",
                desc: "Deep, free tutorials on modern C++ features",
            },
        ],
    },
    {
        category: "Trivia & Gotchas",
        color: "#ef4444",
        links: [
            {
                name: "cppquiz.org",
                url: "https://cppquiz.org",
                desc: "The best C++ trivia quiz site — daily practice recommended",
            },
            {
                name: "Compiler Explorer (godbolt.org)",
                url: "https://godbolt.org",
                desc: "Test snippets live; see assembly for UB investigation",
            },
            {
                name: "C++ Trivia GitHub (rorro/cpp-quiz)",
                url: "https://github.com/rorro/cpp-quiz",
                desc: "Open-source C++ quiz questions with detailed explanations",
            },
        ],
    },
    {
        category: "Design Patterns",
        color: "#5b9cf6",
        links: [
            {
                name: "refactoring.guru/patterns",
                url: "https://refactoring.guru/design-patterns/cpp",
                desc: "Every pattern with C++ code examples",
            },
            {
                name: "sourcemaking.com",
                url: "https://sourcemaking.com/design_patterns",
                desc: "Patterns with UML diagrams and real examples",
            },
        ],
    },
    {
        category: "LLD Practice",
        color: "#7ec98a",
        links: [
            {
                name: "github: prasadgujar/lld-primer",
                url: "https://github.com/prasadgujar/low-level-design-primer",
                desc: "50+ LLD problems with solutions",
            },
            {
                name: "Educative: Grokking LLD",
                url: "https://www.educative.io/courses/grokking-the-low-level-design-interview-using-ood-principles",
                desc: "Structured paid course with guided problem-solving",
            },
        ],
    },
    {
        category: "Books (High ROI)",
        color: "#c084fc",
        links: [
            {
                name: "Effective C++ — Scott Meyers",
                url: "https://www.amazon.com/Effective-Specific-Improve-Programs-Designs/dp/0321334876",
                desc: "55 rules covering the exact gotchas interviewers ask about",
            },
            {
                name: "YouTube: Udit Agarwal LLD Series",
                url: "https://www.youtube.com/c/UditAgarwal21",
                desc: "Most comprehensive free LLD video series",
            },
            {
                name: "YouTube: Concept && Coding",
                url: "https://www.youtube.com/channel/UCCtnLi4KSHKxOVjVY9vUj8Q",
                desc: "C++ design patterns explained clearly",
            },
        ],
    },
];

const approachSteps = [
    {
        step: "1",
        title: "Clarify Requirements",
        desc: "Ask scope questions first. What scale? Constraints? Must-have vs nice-to-have?",
    },
    {
        step: "2",
        title: "Identify Entities",
        desc: "Nouns = candidate classes. Verbs = methods. Underline them as you read.",
    },
    {
        step: "3",
        title: "Define Relationships",
        desc: "IS-A = inheritance. HAS-A = composition (prefer this). Map cardinality: 1:1, 1:N, M:N.",
    },
    {
        step: "4",
        title: "Sketch Class Diagram",
        desc: "Draw on whiteboard: classes, attributes, methods, arrows. Abstract early.",
    },
    {
        step: "5",
        title: "Apply Patterns",
        desc: "Identify where patterns fit naturally. Don't force them.",
    },
    {
        step: "6",
        title: "Write Interfaces First",
        desc: "Define pure virtual base classes before implementations.",
    },
    {
        step: "7",
        title: "Implement Core Logic",
        desc: "Write the most interesting class in full. Show move semantics, RAII, const correctness.",
    },
];

const topicReviews = {
    "RAII & Smart Pointers": [
        {
            q: "What does RAII mean in one sentence, and why does it make exception safety nearly automatic?",
            a: "A resource is acquired in a constructor and released in the destructor, so it can never be leaked even if an exception is thrown — destructors run automatically during stack unwinding.",
        },
        {
            q: "When should you use weak_ptr instead of shared_ptr?",
            a: "Use weak_ptr to observe an object without extending its lifetime — breaking reference cycles (parent/child, observer registries). Call lock() to get a temporary shared_ptr before using it.",
        },
        {
            q: "What is the advantage of make_shared over shared_ptr<T>(new T)?",
            a: "make_shared performs a single heap allocation for both the object and its reference-count block, making it faster and exception-safe. Two separate allocations risk a leak if the constructor throws between them.",
        },
        {
            q: "Can unique_ptr manage a dynamically allocated array?",
            a: "Yes: auto arr = std::make_unique<int[]>(10). It calls delete[] in its destructor. For most use cases, prefer std::vector<int> which also tracks size.",
        },
    ],
    "Rule of 5 & Move Semantics": [
        {
            q: "What is the Rule of Zero, and when can you apply it?",
            a: "If all your class members already manage their own resources (smart pointers, containers), define NONE of the five special functions — the compiler-generated defaults will correctly chain through all members.",
        },
        {
            q: "Why does marking a move constructor noexcept matter for std::vector?",
            a: "std::vector uses move during reallocation ONLY if the element's move constructor is noexcept. Otherwise it falls back to copying to preserve the strong exception guarantee, negating the performance benefit of move semantics.",
        },
        {
            q: "What is the state of an object after it has been moved from?",
            a: "Valid but unspecified. You can safely destroy or reassign it, but must not read its value without first reassigning. For std::string it's typically empty; for user types it depends on the implementation.",
        },
        {
            q: "You declare a destructor but not the move constructor. What does the compiler generate for moves?",
            a: "Nothing — the compiler suppresses implicit move generation when a user-declared destructor exists. The class falls back to copying everywhere moves are attempted, which is a silent performance regression.",
        },
    ],
    "Abstract Classes & Pure Virtual Interfaces": [
        {
            q: "Can an abstract class have a constructor?",
            a: "Yes. It can't be instantiated directly, but its constructor runs when a derived class is constructed. Useful for initializing base-class members shared by all implementations.",
        },
        {
            q: "Can a pure virtual function have a body?",
            a: "Yes — optional. Derived classes must still override it, but can explicitly call the base body: Base::method(). Useful for providing a default fallback that subclasses opt into rather than inherit automatically.",
        },
        {
            q: "What happens if a derived class doesn't override all pure virtual functions?",
            a: "The derived class is also abstract and cannot be instantiated. The compiler gives a clear error listing each unimplemented pure virtual function.",
        },
        {
            q: "Why must a base class with virtual functions have a virtual destructor?",
            a: "So delete base_ptr calls the derived destructor, not just the base one. Without it, the derived class's resources are never freed — undefined behavior and resource leak.",
        },
    ],
    "Virtual Dispatch & Vtables": [
        {
            q: "What is object slicing and how do you prevent it?",
            a: "Slicing occurs when a derived object is copied into a base object by value — derived-specific data and vtable are silently discarded. Prevent it by always passing polymorphic objects by pointer or reference, never by value.",
        },
        {
            q: "What does the override keyword do and why should you always use it?",
            a: "It tells the compiler this function is intended to override a base virtual function, and produces a compile error if the signature doesn't match. Prevents silent bugs from typos, const mismatches, or wrong parameter types.",
        },
        {
            q: "What is the final keyword and when would you use it?",
            a: "On a class: prevents further inheritance. On a method: prevents further overriding. The compiler can also devirtualize final calls, which is a performance win in hot code paths.",
        },
        {
            q: "How many vptrs does a class with two polymorphic base classes typically have?",
            a: "Usually two — one per distinct virtual function table (typically one per base class contributing virtual functions). Each vptr adds 8 bytes on 64-bit, so sizeof increases accordingly.",
        },
    ],
    "enum class & State Modeling": [
        {
            q: "What are the three main advantages of enum class over plain enum?",
            a: "(1) Scoped — MyEnum::Value, values don't pollute the namespace. (2) Strongly typed — no implicit conversion to int. (3) No accidental cross-comparisons between unrelated enum types.",
        },
        {
            q: "How do you convert an enum class value to its underlying integer?",
            a: "Explicit cast: static_cast<int>(MyEnum::Value). You can also query the underlying type at compile time with std::underlying_type_t<MyEnum>.",
        },
        {
            q: "When would you choose State pattern classes over enum class for a state machine?",
            a: "Use State pattern (separate classes) when each state has substantially different behaviour or many methods — avoids giant switch statements and is more open for extension. Use enum class when state transitions are simple and behaviour is small.",
        },
    ],
    "SOLID Principles": [
        {
            q: "Give a one-sentence definition of each SOLID principle.",
            a: "S: one reason to change. O: open to extend, closed to modify. L: derived substitutable for base. I: no client forced to depend on interfaces it doesn't use. D: depend on abstractions, not concretions.",
        },
        {
            q: "What is the classic LSP violation in the Rectangle/Square example?",
            a: "Geometrically Square is-a Rectangle, but if Square::setWidth also sets height, code that relies on 'setting width doesn't affect height' breaks when given a Square — violating the behavioural contract of Rectangle.",
        },
        {
            q: "How does constructor injection implement DIP?",
            a: "The class receives its dependencies (as interface pointers/references) through its constructor rather than creating them internally. It depends on ILogger, not ConcreteLogger — the concrete type is decided by the caller.",
        },
    ],
    "std::function & Callable Objects": [
        {
            q: "What is type erasure and how does std::function use it?",
            a: "Type erasure hides the concrete callable type (lambda, function pointer, functor) behind a uniform interface, allocating it on the heap with a virtual-dispatch-like mechanism. Enables storing heterogeneous callables at runtime without templates.",
        },
        {
            q: "When would you prefer a template parameter for a callback over std::function?",
            a: "When performance matters: a template parameter enables inlining and has zero heap overhead. Use std::function when you need to store the callable as a member variable or accept different callable types at runtime without templates.",
        },
        {
            q: "Can you store a member function pointer in std::function?",
            a: "Yes, wrap it in a lambda: std::function<void()> f = [&obj]{ obj.method(); }; Or use std::bind: std::bind(&Class::method, &obj). The lambda approach is preferred in modern C++.",
        },
    ],
    "Exception Safety & noexcept": [
        {
            q: "Name the three exception safety levels from weakest to strongest.",
            a: "Basic: invariants preserved, no leaks (object may be in a different valid state). Strong: commit-or-rollback — fully succeeds or leaves everything unchanged. No-throw (noexcept): guaranteed never to throw.",
        },
        {
            q: "What happens when a noexcept function throws?",
            a: "std::terminate() is called immediately. The exception does not propagate and stack may or may not unwind. This is intentional — throwing from noexcept is always a programming error.",
        },
        {
            q: "Explain the copy-and-swap idiom and which guarantee it provides.",
            a: "Operator= takes the argument by value (copy). Then swap *this with the copy (noexcept). If the copy throws, *this is unchanged. This provides the strong guarantee automatically and is concise.",
        },
        {
            q: "Why does RAII provide the basic exception guarantee almost for free?",
            a: "RAII destructors run during stack unwinding when an exception propagates. Any resource acquired before the throw is automatically released — no cleanup code needed in catch blocks.",
        },
    ],
    "Class Templates": [
        {
            q: "What is the difference between typename T and class T in a template declaration?",
            a: "Identical in function. typename is preferred in modern C++ for clarity and is required in dependent type contexts like typename T::type to tell the compiler it's a type, not a static value.",
        },
        {
            q: "What is SFINAE?",
            a: "Substitution Failure Is Not An Error — when template argument substitution fails for a particular type, that specialization is silently removed from the overload set instead of causing a compile error. The basis of enable_if<> for conditional template enabling.",
        },
        {
            q: "Can function templates be partially specialized?",
            a: "No — only class templates support partial specialization. For functions, use overloading to achieve the same effect.",
        },
    ],
    "Operator Overloading": [
        {
            q: "Should binary operators like operator+ be member or free functions?",
            a: "Prefer free (non-member) functions for symmetry: both operands are treated equally, and implicit conversions can apply to either side. As a member, the left operand must already be of the class type.",
        },
        {
            q: "What are the signatures for prefix vs postfix operator++?",
            a: "Prefix: T& operator++() — increments in-place and returns *this by reference (fast).\nPostfix: T operator++(int) — saves a copy, increments, returns the saved copy (slower). The dummy int distinguishes the two.",
        },
        {
            q: "Why implement operator!= in terms of operator==?",
            a: "Consistency — they must always agree. bool operator!=(const T& o) const { return !(*this == o); }. In C++20, != is auto-generated from == so you only need operator== and optionally operator<=> (spaceship operator).",
        },
    ],
    "Lambdas & Closures": [
        {
            q: "What is the difference between [=] and [&] capture, and which is more dangerous?",
            a: "[=] captures all local variables by copy — safe lifetime, copies can be expensive. [&] captures by reference — fast, but dangerous if the lambda outlives the captured variables (dangling reference). Prefer explicit captures.",
        },
        {
            q: "What is a mutable lambda and when do you need it?",
            a: "By default, values captured by copy are const inside the lambda. Adding mutable allows modifying them within the lambda (the original variable is unchanged): [x]() mutable { x++; }.",
        },
        {
            q: "How do you capture a move-only type (like unique_ptr) in a lambda?",
            a: "Use C++14 init-capture: [p = std::move(ptr)]() { /* use p */ }. This moves the unique_ptr into the closure. The original ptr is left null after the capture.",
        },
    ],
    "dynamic_cast & RTTI": [
        {
            q: "What is the difference between dynamic_cast<T*> and dynamic_cast<T&>?",
            a: "Pointer form returns nullptr on failure — safe to check with an if. Reference form throws std::bad_cast on failure. Use the pointer form when failure is a valid case; reference form when you're certain and want an exception on mismatch.",
        },
        {
            q: "What requirement must the base class meet for dynamic_cast to work?",
            a: "The class must be polymorphic — it must have at least one virtual function (typically the destructor). RTTI metadata is only generated for polymorphic classes.",
        },
        {
            q: "Why is frequent use of dynamic_cast a design smell?",
            a: "It means the abstraction is leaking — callers need to know the concrete type. Better: add a virtual method to the base class to provide the needed behaviour polymorphically, eliminating the downcast.",
        },
    ],
    "Multiple Inheritance & Virtual Base Classes": [
        {
            q: "What is the diamond problem?",
            a: "D inherits from B and C, both of which inherit from A. Without virtual inheritance, D has two separate copies of A's members, causing ambiguity. With virtual public A, B and C share one A subobject, resolved at D's constructor.",
        },
        {
            q: "What is the order of virtual base class construction?",
            a: "Virtual bases are constructed first, in depth-first left-to-right order, before any non-virtual bases. This ensures exactly one construction of the shared base even when multiple paths lead to it.",
        },
        {
            q: "Why is the mixin pattern (multiple pure interfaces) generally safe?",
            a: "Pure-virtual interfaces have no data members and no meaningful constructors, so there's nothing to duplicate or conflict. Diamond ambiguity only causes real trouble when shared base classes have data or constructor side effects.",
        },
    ],
    "Concurrency Basics": [
        {
            q: "What is a data race and why is it Undefined Behavior?",
            a: "A data race is two or more threads accessing the same memory concurrently with at least one write and no synchronization. It's UB because the compiler and CPU assume no data races and may reorder or elide operations in ways that break concurrent code.",
        },
        {
            q: "When would you use atomic<T> instead of mutex?",
            a: "atomic for isolated single-variable operations (counters, flags) where lock-free performance matters. Use mutex when you need to protect multiple operations atomically together — atomics don't compose across multiple variables.",
        },
        {
            q: "What is RAII locking and why does it matter for exception safety?",
            a: "lock_guard/unique_lock acquire a mutex on construction and release in the destructor. If protected code throws, the lock is still released during stack unwinding. Manual lock/unlock would leave the mutex locked forever on exception.",
        },
    ],
    "std::optional & Type Safety": [
        {
            q: "What is the difference between optional::value() and optional::operator*()?",
            a: "value() throws std::bad_optional_access if the optional is empty — safe but has overhead. operator*() is undefined behavior if empty — fast but no check. Use value() when unsure; use * after verifying has_value().",
        },
        {
            q: "How does optional differ from a raw pointer for optional values?",
            a: "optional owns its value with no heap allocation, has explicit API (has_value(), value_or()), and cannot be accidentally dangled or null-dereferenced without a deliberate operator*. Raw pointers require manual lifetime management.",
        },
        {
            q: "When would you choose variant<A,B> over optional<A>?",
            a: "When there are multiple meaningful types, not just 'value or nothing'. variant<int, string, Error> is a type-safe discriminated union. optional<A> is essentially variant<A, monostate>.",
        },
    ],
};

const PRIORITY_ORDER = ["Critical", "High", "Medium"];
const PRIORITY_COLORS = {
    Critical: "#e07b39",
    High: "#5b9cf6",
    Medium: "#7ec98a",
};
const tabs = [
    "Overview",
    "Topics",
    "Patterns",
    "Practice",
    "Trivia",
    "Resources",
];

// ─── COMPONENT ────────────────────────────────────────────────────────────────
export default function StudyPlan() {
    const [activeTab, setActiveTab] = useState("Overview");
    const [expandedTopic, setExpandedTopic] = useState(null);
    const [expandedPattern, setExpandedPattern] = useState(null);
    const [priorityFilter, setPriorityFilter] = useState("All");
    const [triviaFilter, setTriviaFilter] = useState("All");
    const [revealedAnswers, setRevealedAnswers] = useState({});
    const [revealedReviews, setRevealedReviews] = useState({});
    const [flashcardMode, setFlashcardMode] = useState(false);
    const [flashcardIndex, setFlashcardIndex] = useState(0);
    const [flashcardReveal, setFlashcardReveal] = useState(false);
    const [progress, setProgress] = useState({});

    const getStoredProgress = async () => {
        if (typeof window === "undefined") return null;
        if (window.storage?.get) {
            const r = await window.storage.get("cpp_lld_progress");
            return r?.value ?? null;
        }
        return window.localStorage.getItem("cpp_lld_progress");
    };

    const setStoredProgress = async (value) => {
        if (typeof window === "undefined") return;
        if (window.storage?.set) {
            return window.storage.set("cpp_lld_progress", value);
        }
        window.localStorage.setItem("cpp_lld_progress", value);
    };

    // Load persisted progress on mount
    useEffect(() => {
        (async () => {
            try {
                const stored = await getStoredProgress();
                if (stored) {
                    setProgress(JSON.parse(stored));
                }
            } catch (_) {
                setProgress({});
            }
        })();
    }, []);

    // Toggle a progress key and persist
    const check = useCallback((key, val) => {
        setProgress((prev) => {
            const next = { ...prev, [key]: val };
            setStoredProgress(JSON.stringify(next)).catch(() => {});
            return next;
        });
    }, []);

    const isChecked = (key) => !!progress[key];

    // Pre-compute all trackable keys per section
    const weekKeys = useMemo(
        () => weekPlan.flatMap((w, wi) => w.items.map((_, i) => `w${wi}_${i}`)),
        [],
    );
    const topicKeys = useMemo(() => coreTopics.map((_, i) => `t${i}`), []);
    const patternKeys = useMemo(
        () =>
            patterns.flatMap((c, ci) => c.items.map((_, pi) => `p${ci}_${pi}`)),
        [],
    );
    const problemKeys = useMemo(() => lldProblems.map((_, i) => `pr${i}`), []);
    const triviaAllKeys = useMemo(
        () =>
            triviaCategories.flatMap((c, ci) =>
                c.questions.map((_, qi) => `q${ci}_${qi}`),
            ),
        [],
    );
    const reviewKeys = useMemo(
        () =>
            coreTopics.flatMap((t, ti) =>
                (topicReviews[t.title] || []).map((_, qi) => `rev${ti}_${qi}`),
            ),
        [],
    );

    const ct = (keys) => keys.filter((k) => progress[k]).length;

    const resetProgress = () => {
        if (!window.confirm("Reset all progress?")) return;
        setProgress({});
        setStoredProgress("{}").catch(() => {});
    };

    const filteredTopics =
        priorityFilter === "All"
            ? coreTopics
            : coreTopics.filter((t) => t.tag === priorityFilter);
    const topicCounts = PRIORITY_ORDER.reduce((acc, p) => {
        acc[p] = coreTopics.filter((t) => t.tag === p).length;
        return acc;
    }, {});
    const triviaList =
        triviaFilter === "All"
            ? triviaCategories
            : triviaCategories.filter((c) => c.name === triviaFilter);

    const flashcardQuestions = useMemo(() => {
        return triviaList.flatMap((cat) => {
            const ci = triviaCategories.indexOf(cat);
            return cat.questions.map((q, qi) => ({
                cat,
                ci,
                qi,
                q,
                key: `q${ci}_${qi}`,
            }));
        });
    }, [triviaList]);

    const [shuffleFlashcards, setShuffleFlashcards] = useState(false);

    const displayedFlashcards = useMemo(() => {
        if (!shuffleFlashcards) return flashcardQuestions;
        const arr = [...flashcardQuestions];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }, [flashcardQuestions, shuffleFlashcards]);

    const advanceFlashcard = (delta) => {
        if (!displayedFlashcards.length) return;
        setFlashcardIndex((prev) => {
            const next = (prev + delta + displayedFlashcards.length) % displayedFlashcards.length;
            return next;
        });
        setFlashcardReveal(false);
    };

    const currentFlashcard = displayedFlashcards[flashcardIndex] || null;

    useEffect(() => {
        // reset index when the displayed set changes (shuffle toggled or list changes)
        setFlashcardIndex(0);
    }, [displayedFlashcards]);

    const card = (extra = {}) => ({
        background: "#161b22",
        border: "1px solid #21262d",
        borderRadius: "8px",
        ...extra,
    });
    const toggleAnswer = (key) =>
        setRevealedAnswers((p) => ({ ...p, [key]: !p[key] }));

    return (
        <div
            style={{
                minHeight: "100vh",
                background: "#0d1117",
                color: "#e6edf3",
                fontFamily: "'IBM Plex Mono','Fira Code',monospace",
            }}
        >
            {/* Header */}
            <div
                style={{
                    borderBottom: "1px solid #21262d",
                    padding: "28px 24px 20px",
                    background:
                        "linear-gradient(180deg,#161b22 0%,#0d1117 100%)",
                }}
            >
                <div
                    style={{
                        fontSize: "11px",
                        color: "#7d8590",
                        letterSpacing: "0.15em",
                        textTransform: "uppercase",
                        marginBottom: "8px",
                    }}
                >
                    interview prep
                </div>
                <h1
                    style={{
                        margin: 0,
                        fontSize: "clamp(20px,4vw,28px)",
                        fontWeight: 700,
                        letterSpacing: "-0.02em",
                        fontFamily: "'IBM Plex Mono','Fira Code',monospace",
                    }}
                >
                    <span style={{ color: "#e07b39" }}>C++</span>{" "}
                    <span style={{ color: "#e6edf3" }}>Low-Level Design</span>
                </h1>
                {/* Overall progress bar */}
                {(() => {
                    const allKeys = [
                        ...weekKeys,
                        ...topicKeys,
                        ...patternKeys,
                        ...problemKeys,
                        ...triviaAllKeys,
                        ...reviewKeys,
                    ];
                    const total = allKeys.length;
                    const done = ct(allKeys);
                    const pct = Math.round((done / total) * 100);
                    return (
                        <div style={{ marginTop: "14px" }}>
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    marginBottom: "5px",
                                }}
                            >
                                <span
                                    style={{
                                        fontSize: "11px",
                                        color: "#7d8590",
                                        letterSpacing: "0.08em",
                                        textTransform: "uppercase",
                                    }}
                                >
                                    overall progress
                                </span>
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "10px",
                                    }}
                                >
                                    <span
                                        style={{
                                            fontSize: "12px",
                                            color:
                                                done === total && total > 0
                                                    ? "#7ec98a"
                                                    : "#e07b39",
                                            fontWeight: 600,
                                            fontFamily: "'IBM Plex Mono','Fira Code',monospace",
                                        }}
                                    >
                                        {done}/{total}
                                    </span>
                                    <button
                                        onClick={resetProgress}
                                        title="Reset all progress"
                                        style={{
                                            fontSize: "10px",
                                            color: "#7d8590",
                                            background: "transparent",
                                            border: "1px solid #30363d",
                                            borderRadius: "4px",
                                            padding: "1px 7px",
                                            cursor: "pointer",
                                            fontFamily: "inherit",
                                        }}
                                    >
                                        reset
                                    </button>
                                </div>
                            </div>
                            <div
                                style={{
                                    height: 6,
                                    background: "#21262d",
                                    borderRadius: "3px",
                                    overflow: "hidden",
                                }}
                            >
                                <div
                                    style={{
                                        height: "100%",
                                        width: `${pct}%`,
                                        background:
                                            done === total && total > 0
                                                ? "#7ec98a"
                                                : "linear-gradient(90deg,#e07b39,#c084fc)",
                                        borderRadius: "3px",
                                        transition: "width 0.35s ease",
                                    }}
                                />
                            </div>
                        </div>
                    );
                })()}
            </div>

            {/* Tabs */}
            <div
                style={{
                    display: "flex",
                    borderBottom: "1px solid #21262d",
                    background: "#161b22",
                    overflowX: "auto",
                    scrollbarWidth: "none",
                }}
            >
                {tabs.map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{
                            padding: "12px 18px",
                            border: "none",
                            borderBottom:
                                activeTab === tab
                                    ? "2px solid #e07b39"
                                    : "2px solid transparent",
                            background: "transparent",
                            color: activeTab === tab ? "#e6edf3" : "#7d8590",
                            fontSize: "13px",
                            cursor: "pointer",
                            fontFamily: "inherit",
                            whiteSpace: "nowrap",
                        }}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            <div
                style={{
                    padding: "24px 20px",
                    maxWidth: "900px",
                    margin: "0 auto",
                }}
            >
                {/* ── OVERVIEW ──────────────────────────────────────────────────── */}
                {activeTab === "Overview" && (
                    <div>
                        {/* Section progress dashboard */}
                        <div
                            style={{
                                ...card(),
                                padding: "16px",
                                marginBottom: "24px",
                            }}
                        >
                            <div
                                style={{
                                    fontSize: "11px",
                                    color: "#7d8590",
                                    letterSpacing: "0.1em",
                                    textTransform: "uppercase",
                                    marginBottom: "14px",
                                }}
                            >
                                section progress
                            </div>
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "12px",
                                }}
                            >
                                {[
                                    {
                                        label: "Week Plan",
                                        keys: weekKeys,
                                        color: "#e07b39",
                                    },
                                    {
                                        label: "Topics",
                                        keys: topicKeys,
                                        color: "#5b9cf6",
                                    },
                                    {
                                        label: "Patterns",
                                        keys: patternKeys,
                                        color: "#7ec98a",
                                    },
                                    {
                                        label: "Practice",
                                        keys: problemKeys,
                                        color: "#c084fc",
                                    },
                                    {
                                        label: "Trivia",
                                        keys: triviaAllKeys,
                                        color: "#ef4444",
                                    },
                                    {
                                        label: "Review Questions",
                                        keys: reviewKeys,
                                        color: "#fb923c",
                                    },
                                ].map((s) => (
                                    <ProgressBar
                                        key={s.label}
                                        label={s.label}
                                        completed={ct(s.keys)}
                                        total={s.keys.length}
                                        color={s.color}
                                    />
                                ))}
                            </div>
                        </div>

                        <div style={{ marginBottom: "32px" }}>
                            <div
                                style={{
                                    fontSize: "11px",
                                    color: "#7d8590",
                                    letterSpacing: "0.12em",
                                    textTransform: "uppercase",
                                    marginBottom: "16px",
                                }}
                            >
                                4-week plan
                            </div>
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "12px",
                                }}
                            >
                                {weekPlan.map((w, wi) => {
                                    const wKeys = w.items.map(
                                        (_, i) => `w${wi}_${i}`,
                                    );
                                    return (
                                        <div
                                            key={w.week}
                                            style={{
                                                ...card(),
                                                borderLeft: `3px solid ${w.color}`,
                                                padding: "14px 16px",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    display: "flex",
                                                    justifyContent:
                                                        "space-between",
                                                    alignItems: "center",
                                                    marginBottom: "8px",
                                                }}
                                            >
                                                <span
                                                    style={{
                                                        fontSize: "13px",
                                                        fontWeight: 700,
                                                        fontFamily: "'IBM Plex Mono','Fira Code',monospace",
                                                        color: w.color,
                                                    }}
                                                >
                                                    {w.week}
                                                </span>
                                                <span
                                                    style={{
                                                        fontSize: "11px",
                                                        color: "#8b949e",
                                                        background: "#21262d",
                                                        padding: "2px 8px",
                                                        borderRadius: "10px",
                                                    }}
                                                >
                                                    {w.focus}
                                                </span>
                                            </div>
                                            <div
                                                style={{ marginBottom: "10px" }}
                                            >
                                                <ProgressBar
                                                    completed={ct(wKeys)}
                                                    total={wKeys.length}
                                                    color={w.color}
                                                    slim
                                                />
                                            </div>
                                            {w.items.map((item, i) => {
                                                const k = `w${wi}_${i}`;
                                                return (
                                                    <div
                                                        key={i}
                                                        style={{
                                                            display: "flex",
                                                            alignItems:
                                                                "flex-start",
                                                            gap: "9px",
                                                            marginBottom: "6px",
                                                        }}
                                                    >
                                                        <Checkbox
                                                            checked={isChecked(
                                                                k,
                                                            )}
                                                            onChange={(v) =>
                                                                check(k, v)
                                                            }
                                                            accent={w.color}
                                                        />
                                                        <span
                                                            style={{
                                                                fontSize:
                                                                    "12px",
                                                                color: isChecked(
                                                                    k,
                                                                )
                                                                    ? "#484f58"
                                                                    : "#8b949e",
                                                                textDecoration:
                                                                    isChecked(k)
                                                                        ? "line-through"
                                                                        : "none",
                                                                lineHeight: 1.5,
                                                            }}
                                                        >
                                                            {item}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        <div>
                            <div
                                style={{
                                    fontSize: "11px",
                                    color: "#7d8590",
                                    letterSpacing: "0.12em",
                                    textTransform: "uppercase",
                                    marginBottom: "16px",
                                }}
                            >
                                interview approach
                            </div>
                            {approachSteps.map((s, i) => (
                                <div
                                    key={i}
                                    style={{
                                        display: "flex",
                                        gap: "16px",
                                        paddingBottom: "16px",
                                        position: "relative",
                                    }}
                                >
                                    {i < approachSteps.length - 1 && (
                                        <div
                                            style={{
                                                position: "absolute",
                                                left: "15px",
                                                top: "30px",
                                                width: "1px",
                                                height: "calc(100% - 14px)",
                                                background: "#21262d",
                                            }}
                                        />
                                    )}
                                    <div
                                        style={{
                                            width: "30px",
                                            height: "30px",
                                            borderRadius: "50%",
                                            background: "#161b22",
                                            border: "1px solid #e07b39",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            flexShrink: 0,
                                            fontSize: "12px",
                                            fontWeight: 700,
                                            color: "#e07b39",
                                            zIndex: 1,
                                        }}
                                    >
                                        {s.step}
                                    </div>
                                    <div style={{ paddingTop: "4px" }}>
                                        <div
                                            style={{
                                                fontSize: "13px",
                                                fontWeight: 600,
                                                fontFamily: "'IBM Plex Mono','Fira Code',monospace",
                                                color: "#e6edf3",
                                                marginBottom: "3px",
                                            }}
                                        >
                                            {s.title}
                                        </div>
                                        <div
                                            style={{
                                                fontSize: "12px",
                                                color: "#7d8590",
                                                lineHeight: 1.6,
                                            }}
                                        >
                                            {s.desc}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── TOPICS ────────────────────────────────────────────────────── */}
                {activeTab === "Topics" && (
                    <div>
                        <div style={{ marginBottom: "16px" }}>
                            <ProgressBar
                                label="Topics mastered"
                                completed={ct(topicKeys)}
                                total={topicKeys.length}
                                color="#5b9cf6"
                            />
                        </div>
                        <div
                            style={{
                                display: "flex",
                                gap: "8px",
                                marginBottom: "20px",
                                flexWrap: "wrap",
                            }}
                        >
                            {["All", ...PRIORITY_ORDER].map((p) => (
                                <button
                                    key={p}
                                    onClick={() => setPriorityFilter(p)}
                                    style={{
                                        padding: "5px 12px",
                                        border: "1px solid",
                                        borderRadius: "20px",
                                        cursor: "pointer",
                                        fontSize: "11px",
                                        fontFamily: "inherit",
                                        background:
                                            priorityFilter === p
                                                ? p === "All"
                                                    ? "#e6edf3"
                                                    : PRIORITY_COLORS[p] + "30"
                                                : "transparent",
                                        color:
                                            priorityFilter === p
                                                ? p === "All"
                                                    ? "#0d1117"
                                                    : PRIORITY_COLORS[p]
                                                : "#7d8590",
                                        borderColor:
                                            priorityFilter === p
                                                ? p === "All"
                                                    ? "#e6edf3"
                                                    : PRIORITY_COLORS[p]
                                                : "#21262d",
                                    }}
                                >
                                    {p}
                                    {p !== "All" && ` (${topicCounts[p]})`}
                                    {p === "All" && ` (${coreTopics.length})`}
                                </button>
                            ))}
                        </div>
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "10px",
                            }}
                        >
                            {filteredTopics.map((topic, ti) => {
                                const tIdx = coreTopics.indexOf(topic);
                                const k = `t${tIdx}`;
                                const done = isChecked(k);
                                return (
                                    <div
                                        key={topic.title}
                                        style={{
                                            ...card(),
                                            border: `1px solid ${expandedTopic === topic.title ? topic.tagColor + "50" : done ? "#2ea04326" : "#21262d"}`,
                                            overflow: "hidden",
                                            opacity: done ? 0.75 : 1,
                                            transition: "opacity 0.2s",
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "10px",
                                                padding: "14px 16px",
                                            }}
                                        >
                                            <Checkbox
                                                checked={done}
                                                onChange={(v) => check(k, v)}
                                                accent={topic.tagColor}
                                            />
                                            <button
                                                onClick={() =>
                                                    setExpandedTopic(
                                                        expandedTopic ===
                                                            topic.title
                                                            ? null
                                                            : topic.title,
                                                    )
                                                }
                                                style={{
                                                    flex: 1,
                                                    background: "transparent",
                                                    border: "none",
                                                    cursor: "pointer",
                                                    textAlign: "left",
                                                    display: "flex",
                                                    justifyContent:
                                                        "space-between",
                                                    alignItems: "center",
                                                    padding: 0,
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: "10px",
                                                        flexWrap: "wrap",
                                                    }}
                                                >
                                                    <span
                                                        style={{
                                                            fontSize: "13px",
                                                            fontWeight: 600,
                                                            color: done
                                                                ? "#484f58"
                                                                : "#e6edf3",
                                                            textDecoration: done
                                                                ? "line-through"
                                                                : "none",
                                                            fontFamily: "'IBM Plex Mono','Fira Code',monospace",
                                                        }}
                                                    >
                                                        {topic.title}
                                                    </span>
                                                    <span
                                                        style={{
                                                            fontSize: "10px",
                                                            color: topic.tagColor,
                                                            background:
                                                                topic.tagColor +
                                                                "20",
                                                            padding: "2px 7px",
                                                            borderRadius:
                                                                "10px",
                                                            fontFamily:
                                                                "'IBM Plex Mono','Fira Code',monospace",
                                                        }}
                                                    >
                                                        {topic.tag}
                                                    </span>
                                                </div>
                                                <span
                                                    style={{
                                                        color: "#7d8590",
                                                        fontSize: "16px",
                                                        flexShrink: 0,
                                                        marginLeft: "8px",
                                                        transform:
                                                            expandedTopic ===
                                                            topic.title
                                                                ? "rotate(90deg)"
                                                                : "none",
                                                        transition:
                                                            "transform 0.2s",
                                                    }}
                                                >
                                                    ›
                                                </span>
                                            </button>
                                        </div>
                                        {expandedTopic === topic.title && (
                                            <div
                                                style={{
                                                    padding: "0 16px 16px",
                                                }}
                                            >
                                                <p
                                                    style={{
                                                        fontSize: "12px",
                                                        color: "#8b949e",
                                                        background: "#21262d",
                                                        padding: "2px 8px",
                                                        fontFamily: "'IBM Plex Mono','Fira Code',monospace",
                                                    }}
                                                >
                                                    {topic.summary}
                                                </p>
                                                <CodeBlock code={topic.code} />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* ── PATTERNS ──────────────────────────────────────────────────── */}
                {activeTab === "Patterns" && (
                    <div>
                        <div style={{ marginBottom: "20px" }}>
                            <ProgressBar
                                label="Patterns known"
                                completed={ct(patternKeys)}
                                total={patternKeys.length}
                                color="#7ec98a"
                            />
                        </div>
                        {patterns.map((cat, ci) => (
                            <div key={ci} style={{ marginBottom: "28px" }}>
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "8px",
                                        marginBottom: "12px",
                                        borderBottom: `1px solid ${cat.color}30`,
                                        paddingBottom: "8px",
                                    }}
                                >
                                    <span
                                        style={{
                                            color: cat.color,
                                            fontSize: "16px",
                                        }}
                                    >
                                        {cat.icon}
                                    </span>
                                    <span
                                        style={{
                                            fontSize: "12px",
                                            fontWeight: 700,
                                            fontFamily: "'IBM Plex Mono','Fira Code',monospace",
                                            color: cat.color,
                                            textTransform: "uppercase",
                                            letterSpacing: "0.1em",
                                        }}
                                    >
                                        {cat.category}
                                    </span>
                                    <span
                                        style={{
                                            marginLeft: "auto",
                                            fontSize: "11px",
                                            color: cat.color,
                                        }}
                                    >
                                        {ct(
                                            cat.items.map(
                                                (_, pi) => `p${ci}_${pi}`,
                                            ),
                                        )}
                                        /{cat.items.length}
                                    </span>
                                </div>
                                <div
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: "10px",
                                    }}
                                >
                                    {cat.items.map((p, pi) => {
                                        const eKey = `${ci}-${pi}`;
                                        const k = `p${ci}_${pi}`;
                                        const done = isChecked(k);
                                        return (
                                            <div
                                                key={pi}
                                                style={{
                                                    ...card(),
                                                    border: `1px solid ${expandedPattern === eKey ? cat.color + "50" : "#21262d"}`,
                                                    overflow: "hidden",
                                                    opacity: done ? 0.75 : 1,
                                                    transition: "opacity 0.2s",
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        alignItems:
                                                            "flex-start",
                                                        gap: "10px",
                                                        padding: "13px 16px",
                                                    }}
                                                >
                                                    <Checkbox
                                                        checked={done}
                                                        onChange={(v) =>
                                                            check(k, v)
                                                        }
                                                        accent={cat.color}
                                                    />
                                                    <button
                                                        onClick={() =>
                                                            setExpandedPattern(
                                                                expandedPattern ===
                                                                    eKey
                                                                    ? null
                                                                    : eKey,
                                                            )
                                                        }
                                                        style={{
                                                            flex: 1,
                                                            background:
                                                                "transparent",
                                                            border: "none",
                                                            cursor: "pointer",
                                                            textAlign: "left",
                                                            padding: 0,
                                                        }}
                                                    >
                                                        <div
                                                            style={{
                                                                fontSize:
                                                                    "13px",
                                                                fontWeight: 600,
                                                                color: done
                                                                    ? "#484f58"
                                                                    : "#e6edf3",
                                                                textDecoration:
                                                                    done
                                                                        ? "line-through"
                                                                        : "none",
                                                                fontFamily:
                                                                    "'IBM Plex Mono','Fira Code',monospace",
                                                            }}
                                                        >
                                                            {p.name}
                                                        </div>
                                                        <div
                                                            style={{
                                                                fontSize:
                                                                    "11px",
                                                                color: "#7d8590",
                                                                marginTop:
                                                                    "3px",
                                                                fontFamily:
                                                                    "'IBM Plex Mono','Fira Code',monospace",
                                                            }}
                                                        >
                                                            Use when: {p.when}
                                                        </div>
                                                    </button>
                                                    <span
                                                        style={{
                                                            color: "#7d8590",
                                                            fontSize: "16px",
                                                            flexShrink: 0,
                                                            transform:
                                                                expandedPattern === eKey
                                                                    ? "rotate(90deg)"
                                                                    : "none",
                                                            transition: "transform 0.2s",
                                                        }}
                                                    >
                                                        ›
                                                    </span>
                                                </div>
                                                {expandedPattern === eKey && (
                                                    <div
                                                        style={{
                                                            padding:
                                                                "0 16px 16px",
                                                        }}
                                                    >
                                                        <CodeBlock
                                                            code={p.code}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* ── PRACTICE ──────────────────────────────────────────────────── */}
                {activeTab === "Practice" && (
                    <div>
                        <div style={{ marginBottom: "20px" }}>
                            <ProgressBar
                                label="Problems completed"
                                completed={ct(problemKeys)}
                                total={problemKeys.length}
                                color="#c084fc"
                            />
                        </div>
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "12px",
                            }}
                        >
                            {lldProblems.map((p, i) => {
                                const k = `pr${i}`;
                                const done = isChecked(k);
                                return (
                                    <div
                                        key={i}
                                        style={{
                                            ...card(),
                                            padding: "16px",
                                            opacity: done ? 0.75 : 1,
                                            transition: "opacity 0.2s",
                                            borderLeft: done
                                                ? "3px solid #7ec98a"
                                                : "3px solid transparent",
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "center",
                                                marginBottom: "10px",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "10px",
                                                }}
                                            >
                                                <Checkbox
                                                    checked={done}
                                                    onChange={(v) =>
                                                        check(k, v)
                                                    }
                                                    accent="#c084fc"
                                                />
                                                <span
                                                    style={{
                                                        fontSize: "14px",
                                                        fontWeight: 700,
                                                        color: done
                                                            ? "#484f58"
                                                            : "#e6edf3",
                                                        textDecoration: done
                                                            ? "line-through"
                                                            : "none",
                                                        fontFamily:
                                                            "'IBM Plex Mono','Fira Code',monospace",
                                                    }}
                                                >
                                                    {p.name}
                                                </span>
                                            </div>
                                            <span
                                                style={{
                                                    fontSize: "10px",
                                                    padding: "2px 8px",
                                                    borderRadius: "10px",
                                                    background:
                                                        p.difficulty === "Easy"
                                                            ? "#7ec98a20"
                                                            : p.difficulty ===
                                                                "Medium"
                                                              ? "#5b9cf620"
                                                              : "#e07b3920",
                                                    color:
                                                        p.difficulty === "Easy"
                                                            ? "#7ec98a"
                                                            : p.difficulty ===
                                                                "Medium"
                                                              ? "#5b9cf6"
                                                              : "#e07b39",
                                                       fontFamily: "'IBM Plex Mono','Fira Code',monospace",
                                                }}
                                            >
                                                {p.difficulty}
                                            </span>
                                        </div>
                                        <div style={{ marginBottom: "10px" }}>
                                            <div
                                                style={{
                                                    fontSize: "10px",
                                                    color: "#7d8590",
                                                    textTransform: "uppercase",
                                                    letterSpacing: "0.08em",
                                                    marginBottom: "5px",
                                                }}
                                            >
                                                key concepts
                                            </div>
                                            <div
                                                style={{
                                                    display: "flex",
                                                    flexWrap: "wrap",
                                                    gap: "5px",
                                                }}
                                            >
                                                {p.concepts.map((c, j) => (
                                                    <span
                                                        key={j}
                                                        style={{
                                                            fontSize: "11px",
                                                            padding: "2px 8px",
                                                            background:
                                                                "#21262d",
                                                            borderRadius:
                                                                "10px",
                                                            color: "#8b949e",
                                                        }}
                                                    >
                                                        {c}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        <div style={{ marginBottom: "10px" }}>
                                            <div
                                                style={{
                                                    fontSize: "10px",
                                                    color: "#7d8590",
                                                    textTransform: "uppercase",
                                                    letterSpacing: "0.08em",
                                                    marginBottom: "4px",
                                                }}
                                            >
                                                entities hint
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: "11px",
                                                    color: "#5b9cf6",
                                                    fontStyle: "italic",
                                                    lineHeight: 1.6,
                                                }}
                                            >
                                                {p.entitiesHint}
                                            </div>
                                        </div>
                                        <div
                                            style={{
                                                fontSize: "12px",
                                                color: "#8b949e",
                                                lineHeight: 1.6,
                                                background: "#0d1117",
                                                padding: "8px 10px",
                                                borderRadius: "5px",
                                                borderLeft: "2px solid #e07b39",
                                            }}
                                        >
                                            <span style={{ color: "#e07b39" }}>
                                                tip:{" "}
                                            </span>
                                            {p.tip}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* ── TRIVIA ────────────────────────────────────────────────────── */}
                {activeTab === "Trivia" && (
                    <div>
                        <div
                            style={{
                                ...card(),
                                borderLeft: "3px solid #ef4444",
                                padding: "14px 16px",
                                marginBottom: "16px",
                            }}
                        >
                            <div
                                style={{
                                    fontSize: "13px",
                                    fontWeight: 700,
                                    fontFamily: "'IBM Plex Mono','Fira Code',monospace",
                                    color: "#ef4444",
                                    marginBottom: "6px",
                                }}
                            >
                                What C++ trivia looks like
                            </div>
                            <p
                                style={{
                                    fontSize: "12px",
                                    color: "#8b949e",
                                    lineHeight: 1.7,
                                    margin: 0,
                                }}
                            >
                                The interviewer shows you a 5–15 line snippet
                                and asks <em>"What does this print?"</em>,{" "}
                                <em>"Is this safe?"</em>, or{" "}
                                <em>"What's the bug?"</em>. The answer often
                                involves Undefined Behavior, virtual dispatch
                                rules, initialization order, or move semantics.
                                Tap any question to reveal the answer.
                            </p>
                        </div>
                        <div style={{ marginBottom: "16px" }}>
                            <ProgressBar
                                label="Questions reviewed"
                                completed={ct(triviaAllKeys)}
                                total={triviaAllKeys.length}
                                color="#ef4444"
                            />
                        </div>
                        <div
                            style={{
                                ...card(),
                                padding: "14px 16px",
                                marginBottom: "20px",
                                borderLeft: "3px solid #5b9cf6",
                            }}
                        >
                            <div
                                style={{
                                    fontSize: "12px",
                                    fontWeight: 700,
                                    fontFamily: "'IBM Plex Mono','Fira Code',monospace",
                                    color: "#5b9cf6",
                                    marginBottom: "8px",
                                }}
                            >
                                How to study trivia
                            </div>
                            {[
                                "Daily 10 questions on cppquiz.org — do this every day in Week 4",
                                "When you get one wrong, look up the exact standard rule, not just the answer",
                                "Test guesses on Compiler Explorer (godbolt.org) — watch for UB sanitizer output",
                                "Group gotchas by category; patterns repeat (e.g. 'virtual in ctor' is always wrong)",
                                "For each UB: know the fix, not just that it's broken",
                            ].map((s, i) => (
                                <div
                                    key={i}
                                    style={{
                                        fontSize: "12px",
                                        color: "#8b949e",
                                        display: "flex",
                                        gap: "8px",
                                        marginBottom: "5px",
                                    }}
                                >
                                    <span
                                        style={{
                                            color: "#5b9cf6",
                                            flexShrink: 0,
                                        }}
                                    >
                                        ›
                                    </span>
                                    <span>{s}</span>
                                </div>
                            ))}
                        </div>
                        <div
                            style={{
                                display: "flex",
                                gap: "10px",
                                flexWrap: "wrap",
                                marginBottom: "20px",
                            }}
                        >
                            <button
                                onClick={() => {
                                    setFlashcardMode(false);
                                    setFlashcardReveal(false);
                                }}
                                style={{
                                    padding: "6px 14px",
                                    borderRadius: "999px",
                                    border: "1px solid #30363d",
                                    background: flashcardMode ? "transparent" : "#c084fc",
                                    color: flashcardMode ? "#8b949e" : "#0d1117",
                                    cursor: "pointer",
                                    fontSize: "11px",
                                    fontFamily: "inherit",
                                }}
                            >
                                List review
                            </button>
                            <button
                                onClick={() => {
                                    setFlashcardMode(true);
                                    setFlashcardIndex(0);
                                    setFlashcardReveal(false);
                                }}
                                style={{
                                    padding: "6px 14px",
                                    borderRadius: "999px",
                                    border: "1px solid #30363d",
                                    background: flashcardMode ? "#2dd4bf" : "transparent",
                                    color: flashcardMode ? "#0d1117" : "#8b949e",
                                    cursor: "pointer",
                                    fontSize: "11px",
                                    fontFamily: "inherit",
                                }}
                            >
                                Flashcards
                            </button>
                        </div>
                        {flashcardMode ? (
                            <div
                                style={{
                                    ...card(),
                                    borderLeft: "3px solid #2dd4bf",
                                    marginBottom: "24px",
                                    padding: "18px 20px",
                                }}
                            >
                                {currentFlashcard ? (
                                    <>
                                        <div
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "space-between",
                                                gap: "12px",
                                                marginBottom: "14px",
                                            }}
                                        >
                                            <div>
                                                <div
                                                    style={{
                                                        fontSize: "11px",
                                                        letterSpacing: "0.12em",
                                                        textTransform: "uppercase",
                                                        color: currentFlashcard.cat.color,
                                                        fontWeight: 700,
                                                        fontFamily: "'IBM Plex Mono','Fira Code',monospace",
                                                        marginBottom: "4px",
                                                    }}
                                                >
                                                    {currentFlashcard.cat.icon} {currentFlashcard.cat.name}
                                                </div>
                                                <div
                                                    style={{
                                                        fontSize: "12px",
                                                        color: "#8b949e",
                                                    }}
                                                >
                                                    Card {flashcardIndex + 1} of {flashcardQuestions.length}
                                                </div>
                                            </div>
                                            <div
                                                style={{
                                                    display: "flex",
                                                    gap: "8px",
                                                    flexWrap: "wrap",
                                                }}
                                            >
                                                <button
                                                    onClick={() => advanceFlashcard(-1)}
                                                    style={{
                                                        padding: "6px 12px",
                                                        borderRadius: "8px",
                                                        border: "1px solid #30363d",
                                                        background: "transparent",
                                                        color: "#8b949e",
                                                        fontSize: "11px",
                                                        cursor: "pointer",
                                                        fontFamily: "inherit",
                                                    }}
                                                >
                                                    Previous
                                                </button>
                                                <button
                                                    onClick={() => setShuffleFlashcards((s) => !s)}
                                                    title="Toggle shuffle"
                                                    style={{
                                                        padding: "6px 12px",
                                                        borderRadius: "8px",
                                                        border: "1px solid #30363d",
                                                        background: shuffleFlashcards ? "#2dd4bf" : "transparent",
                                                        color: shuffleFlashcards ? "#0d1117" : "#8b949e",
                                                        fontSize: "11px",
                                                        cursor: "pointer",
                                                        fontFamily: "inherit",
                                                    }}
                                                >
                                                    {shuffleFlashcards ? "Shuffle On" : "Shuffle Off"}
                                                </button>
                                                <button
                                                    onClick={() => advanceFlashcard(1)}
                                                    style={{
                                                        padding: "6px 12px",
                                                        borderRadius: "8px",
                                                        border: "1px solid #30363d",
                                                        background: "#2dd4bf",
                                                        color: "#0d1117",
                                                        fontSize: "11px",
                                                        cursor: "pointer",
                                                        fontFamily: "inherit",
                                                    }}
                                                >
                                                    Next
                                                </button>
                                            </div>
                                        </div>
                                        <div
                                            style={{
                                                border: `1px solid ${currentFlashcard.cat.color}30`,
                                                borderRadius: "10px",
                                                padding: "18px",
                                                background: "#0d1117",
                                                marginBottom: "18px",
                                            }}
                                        >
                                            <div
                                                style={{
                                                    fontSize: "12px",
                                                    color: "#c9d1d9",
                                                    marginBottom: "12px",
                                                    whiteSpace: "pre-wrap",
                                                    lineHeight: 1.7,
                                                }}
                                            >
                                                {splitQuestion(currentFlashcard.q.q).question}
                                            </div>
                                            {splitQuestion(currentFlashcard.q.q).code && (
                                                <div style={{ marginTop: "10px" }}>
                                                    <CodeBlock
                                                        code={splitQuestion(currentFlashcard.q.q).code}
                                                        borderColor={currentFlashcard.cat.color + "40"}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                        <div
                                            style={{
                                                display: "flex",
                                                gap: "10px",
                                                flexWrap: "wrap",
                                                alignItems: "center",
                                            }}
                                        >
                                            <button
                                                onClick={() => setFlashcardReveal((visible) => !visible)}
                                                style={{
                                                    padding: "8px 16px",
                                                    borderRadius: "8px",
                                                    border: "1px solid #30363d",
                                                    background: flashcardReveal ? currentFlashcard.cat.color + "20" : "transparent",
                                                    color: flashcardReveal ? currentFlashcard.cat.color : "#8b949e",
                                                    fontSize: "12px",
                                                    cursor: "pointer",
                                                    fontFamily: "inherit",
                                                }}
                                            >
                                                {flashcardReveal ? "Hide answer ▲" : "Reveal answer ▼"}
                                            </button>
                                            <button
                                                onClick={() => {
                                                    check(currentFlashcard.key, true);
                                                    advanceFlashcard(1);
                                                }}
                                                style={{
                                                    padding: "8px 16px",
                                                    borderRadius: "8px",
                                                    border: "1px solid #30363d",
                                                    background: currentFlashcard.cat.color,
                                                    color: "#0d1117",
                                                    fontSize: "12px",
                                                    cursor: "pointer",
                                                    fontFamily: "inherit",
                                                }}
                                            >
                                                Mark Reviewed & Next
                                            </button>
                                            <button
                                                onClick={() => {
                                                    check(currentFlashcard.key, false);
                                                    advanceFlashcard(1);
                                                }}
                                                style={{
                                                    padding: "8px 16px",
                                                    borderRadius: "8px",
                                                    border: "1px solid #30363d",
                                                    background: "transparent",
                                                    color: "#8b949e",
                                                    fontSize: "12px",
                                                    cursor: "pointer",
                                                    fontFamily: "inherit",
                                                }}
                                            >
                                                Again
                                            </button>
                                        </div>
                                        {flashcardReveal && (
                                            <div
                                                style={{
                                                    marginTop: "18px",
                                                    padding: "16px",
                                                    border: `1px solid ${currentFlashcard.cat.color}30`,
                                                    borderRadius: "10px",
                                                    background: "#010409",
                                                    whiteSpace: "pre-wrap",
                                                    lineHeight: 1.7,
                                                    color: "#8b949e",
                                                    fontSize: "11px",
                                                }}
                                            >
                                                {currentFlashcard.q.a}
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div
                                        style={{
                                            fontSize: "12px",
                                            color: "#8b949e",
                                        }}
                                    >
                                        No trivia cards available for this selection.
                                    </div>
                                )}
                            </div>
                        ) : null}
                        {!flashcardMode && (
                            <>
                                {/* Category filter */}
                                <div
                                    style={{
                                        display: "flex",
                                        gap: "7px",
                                        marginBottom: "20px",
                                        flexWrap: "wrap",
                                    }}
                        >
                            <button
                                onClick={() => setTriviaFilter("All")}
                                style={{
                                    padding: "4px 10px",
                                    border: "1px solid",
                                    borderRadius: "20px",
                                    cursor: "pointer",
                                    fontSize: "11px",
                                    fontFamily: "inherit",
                                    background:
                                        triviaFilter === "All"
                                            ? "#e6edf3"
                                            : "transparent",
                                    color:
                                        triviaFilter === "All"
                                            ? "#0d1117"
                                            : "#7d8590",
                                    borderColor:
                                        triviaFilter === "All"
                                            ? "#e6edf3"
                                            : "#21262d",
                                }}
                            >
                                All
                            </button>
                            {triviaCategories.map((c, ci) => {
                                const catKeys = c.questions.map(
                                    (_, qi) => `q${ci}_${qi}`,
                                );
                                const catDone = ct(catKeys);
                                return (
                                    <button
                                        key={c.name}
                                        onClick={() => setTriviaFilter(c.name)}
                                        style={{
                                            padding: "4px 10px",
                                            border: "1px solid",
                                            borderRadius: "20px",
                                            cursor: "pointer",
                                            fontSize: "11px",
                                            fontFamily: "inherit",
                                            background:
                                                triviaFilter === c.name
                                                    ? c.color + "25"
                                                    : "transparent",
                                            color:
                                                triviaFilter === c.name
                                                    ? c.color
                                                    : "#7d8590",
                                            borderColor:
                                                triviaFilter === c.name
                                                    ? c.color
                                                    : "#21262d",
                                            whiteSpace: "nowrap",
                                        }}
                                    >
                                        {c.icon} {c.name}
                                        {catDone > 0 &&
                                            ` ${catDone}/${catKeys.length}`}
                                    </button>
                                );
                            })}
                        </div>
                        {/* Q&A cards */}
                        {triviaList.map((cat, ci) => {
                            const realCi = triviaCategories.indexOf(cat);
                            const catKeys = cat.questions.map(
                                (_, qi) => `q${realCi}_${qi}`,
                            );
                            return (
                                <div key={ci} style={{ marginBottom: "28px" }}>
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "8px",
                                            marginBottom: "6px",
                                        }}
                                    >
                                        <span
                                            style={{
                                                color: cat.color,
                                                fontSize: "16px",
                                            }}
                                        >
                                            {cat.icon}
                                        </span>
                                        <span
                                            style={{
                                                fontSize: "12px",
                                                fontWeight: 700,
                                                color: cat.color,
                                                textTransform: "uppercase",
                                                letterSpacing: "0.1em",
                                            }}
                                        >
                                            {cat.name}
                                        </span>
                                        <span
                                            style={{
                                                marginLeft: "auto",
                                                fontSize: "11px",
                                                color: cat.color,
                                            }}
                                        >
                                            {ct(catKeys)}/{catKeys.length}
                                        </span>
                                    </div>
                                    <div style={{ marginBottom: "10px" }}>
                                        <ProgressBar
                                            completed={ct(catKeys)}
                                            total={catKeys.length}
                                            color={cat.color}
                                            slim
                                        />
                                    </div>
                                    <p
                                        style={{
                                            fontSize: "12px",
                                            color: "#7d8590",
                                            marginBottom: "12px",
                                            lineHeight: 1.6,
                                        }}
                                    >
                                        {cat.desc}
                                    </p>
                                    <div
                                        style={{
                                            display: "flex",
                                            flexDirection: "column",
                                            gap: "10px",
                                        }}
                                    >
                                        {cat.questions.map((q, qi) => {
                                            const eKey = `${ci}-${qi}`;
                                            const k = `q${realCi}_${qi}`;
                                            const done = isChecked(k);
                                            const revealed =
                                                !!revealedAnswers[eKey];
                                            const { question, code } =
                                                splitQuestion(q.q);
                                            return (
                                                <div
                                                    key={qi}
                                                    style={{
                                                        ...card(),
                                                        border: `1px solid ${done ? cat.color + "50" : revealed ? cat.color + "40" : "#21262d"}`,
                                                        overflow: "hidden",
                                                        opacity: done
                                                            ? 0.72
                                                            : 1,
                                                        transition:
                                                            "opacity 0.2s",
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            padding:
                                                                "14px 16px",
                                                        }}
                                                    >
                                                        <div
                                                            style={{
                                                                display: "flex",
                                                                justifyContent:
                                                                    "space-between",
                                                                alignItems:
                                                                    "center",
                                                                marginBottom:
                                                                    "10px",
                                                            }}
                                                        >
                                                            <span
                                                                style={{
                                                                    fontSize:
                                                                        "10px",
                                                                    color: cat.color,
                                                                    background:
                                                                        cat.color +
                                                                        "20",
                                                                        padding:
                                                                            "2px 7px",
                                                                    borderRadius:
                                                                        "10px",
                                                                        fontFamily:
                                                                            "'IBM Plex Mono','Fira Code',monospace",
                                                                }}
                                                            >
                                                                {q.tag}
                                                            </span>
                                                            {done && (
                                                                <span
                                                                    style={{
                                                                        fontSize:
                                                                            "10px",
                                                                        color: cat.color,
                                                                    }}
                                                                >
                                                                    ✓ reviewed
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p
                                                            style={{
                                                                fontSize:
                                                                    "12px",
                                                                color: done
                                                                    ? "#484f58"
                                                                    : "#c9d1d9",
                                                                marginBottom:
                                                                    code
                                                                        ? "10px"
                                                                        : "12px",
                                                                lineHeight: 1.6,
                                                            }}
                                                        >
                                                            {question}
                                                        </p>
                                                        {code && (
                                                            <div
                                                                style={{
                                                                    marginBottom:
                                                                        "12px",
                                                                }}
                                                            >
                                                                <CodeBlock
                                                                    code={code}
                                                                    borderColor={
                                                                        cat.color +
                                                                        "40"
                                                                    }
                                                                />
                                                            </div>
                                                        )}
                                                        <div
                                                            style={{
                                                                display: "flex",
                                                                alignItems:
                                                                    "center",
                                                                gap: "10px",
                                                            }}
                                                        >
                                                            <button
                                                                onClick={() =>
                                                                    toggleAnswer(
                                                                        eKey,
                                                                    )
                                                                }
                                                                style={{
                                                                    padding:
                                                                        "6px 14px",
                                                                    background:
                                                                        revealed
                                                                            ? cat.color +
                                                                              "20"
                                                                            : "#21262d",
                                                                    border: `1px solid ${revealed ? cat.color : "#30363d"}`,
                                                                    borderRadius:
                                                                        "6px",
                                                                    color: revealed
                                                                        ? cat.color
                                                                        : "#8b949e",
                                                                    fontSize:
                                                                        "12px",
                                                                    cursor: "pointer",
                                                                    fontFamily:
                                                                        "inherit",
                                                                }}
                                                            >
                                                                {revealed
                                                                    ? "Hide ▲"
                                                                    : "Show answer ▼"}
                                                            </button>
                                                            <div
                                                                style={{
                                                                    display:
                                                                        "flex",
                                                                    alignItems:
                                                                        "center",
                                                                    gap: "6px",
                                                                }}
                                                            >
                                                                <Checkbox
                                                                    checked={
                                                                        done
                                                                    }
                                                                    onChange={(
                                                                        v,
                                                                    ) =>
                                                                        check(
                                                                            k,
                                                                            v,
                                                                        )
                                                                    }
                                                                    accent={
                                                                        cat.color
                                                                    }
                                                                />
                                                                <span
                                                                    style={{
                                                                        fontSize:
                                                                            "11px",
                                                                        color: "#7d8590",
                                                                    }}
                                                                >
                                                                    reviewed
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {revealed && (
                                                        <div
                                                            style={{
                                                                padding:
                                                                    "0 16px 16px",
                                                                borderTop:
                                                                    "1px solid #21262d",
                                                            }}
                                                        >
                                                            <div
                                                                style={{
                                                                    fontSize:
                                                                        "10px",
                                                                    color: cat.color,
                                                                    textTransform:
                                                                        "uppercase",
                                                                    letterSpacing:
                                                                        "0.08em",
                                                                    margin: "12px 0 8px",
                                                                }}
                                                            >
                                                                Answer
                                                            </div>
                                                            <pre
                                                                style={{
                                                                    background:
                                                                        "#010409",
                                                                    border: `1px solid ${cat.color}30`,
                                                                    borderRadius:
                                                                        "6px",
                                                                    padding:
                                                                        "12px",
                                                                    margin: 0,
                                                                    fontSize:
                                                                        "11px",
                                                                    lineHeight: 1.9,
                                                                    color: "#8b949e",
                                                                    overflowX:
                                                                        "auto",
                                                                    whiteSpace:
                                                                        "pre-wrap",
                                                                    wordBreak:
                                                                        "break-word",
                                                                    fontFamily:
                                                                        "inherit",
                                                                }}
                                                            >
                                                                {q.a}
                                                            </pre>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                            </>
                        )}
                    </div>
                )}

                {/* ── RESOURCES ─────────────────────────────────────────────────── */}
                {activeTab === "Resources" && (
                    <div>
                        <p
                            style={{
                                color: "#8b949e",
                                fontSize: "13px",
                                marginBottom: "20px",
                                lineHeight: 1.6,
                            }}
                        >
                            cppquiz.org + Udit Agarwal + prasadgujar GitHub are
                            the highest-value free resources.
                        </p>
                        {resources.map((cat, ci) => (
                            <div key={ci} style={{ marginBottom: "24px" }}>
                                <div
                                    style={{
                                        fontSize: "11px",
                                        color: cat.color,
                                        textTransform: "uppercase",
                                        letterSpacing: "0.12em",
                                        marginBottom: "10px",
                                        fontWeight: 700,
                                    }}
                                >
                                    {cat.category}
                                </div>
                                <div
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: "8px",
                                    }}
                                >
                                    {cat.links.map((link, li) => (
                                        <a
                                            key={li}
                                            href={link.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{
                                                ...card(),
                                                padding: "12px 14px",
                                                textDecoration: "none",
                                                display: "block",
                                            }}
                                            onMouseEnter={(e) =>
                                                (e.currentTarget.style.borderColor =
                                                    cat.color + "60")
                                            }
                                            onMouseLeave={(e) =>
                                                (e.currentTarget.style.borderColor =
                                                    "#21262d")
                                            }
                                        >
                                            <div
                                                style={{
                                                    fontSize: "13px",
                                                    color: cat.color,
                                                    marginBottom: "3px",
                                                }}
                                            >
                                                {link.name}
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: "11px",
                                                    color: "#7d8590",
                                                    lineHeight: 1.5,
                                                }}
                                            >
                                                {link.desc}
                                            </div>
                                        </a>
                                    ))}
                                </div>
                            </div>
                        ))}
                        <div
                            style={{
                                ...card(),
                                border: "1px solid #e07b3940",
                                padding: "16px",
                                marginTop: "8px",
                            }}
                        >
                            <div
                                style={{
                                    fontSize: "12px",
                                    color: "#e07b39",
                                    fontWeight: 700,
                                    marginBottom: "8px",
                                }}
                            >
                                📌 Recommended Order
                            </div>
                            {[
                                "1. learncpp.com — fill C++ gaps first",
                                "2. refactoring.guru/patterns/cpp — all patterns with code",
                                "3. Udit Agarwal YouTube — watch 3–4 full LLD walkthroughs",
                                "4. prasadgujar GitHub — solve problems independently",
                                "5. cppquiz.org — 10 questions/day from Week 3 onward",
                                "6. Mock interview with a timer — 45 min per LLD problem",
                            ].map((s, i) => (
                                <div
                                    key={i}
                                    style={{
                                        fontSize: "12px",
                                        color: "#8b949e",
                                        lineHeight: 1.8,
                                    }}
                                >
                                    {s}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
