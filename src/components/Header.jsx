import Typewriter from "typewriter-effect"

// Box is 56×56px. All robots are anchored at top:50% left:50% always —
// only transform and opacity animate, so nothing triggers layout reflow.
// Movement is encoded as translate() offsets; size change as scale().

const BOX = 48

const SINGLE_TRANSFORM = 'translate(-50%, -50%) scale(1)'
const MULTI_TRANSFORMS = [
    'translate(-50%, calc(-50% - 10px)) scale(0.65)',   // top-center
    'translate(calc(-50% - 10px), calc(-50% + 10px)) scale(0.65)',  // bottom-left
    'translate(calc(-50% + 10px), calc(-50% + 10px)) scale(0.65)',  // bottom-right
]

const robotStyle = (isMulti, idx) => ({
    position: 'absolute',
    top: '50%',
    left: '50%',
    fontSize: '1.3rem',
    lineHeight: 1,
    willChange: 'transform, opacity',
    transition: 'transform 0.45s ease, opacity 0.45s ease',
    opacity: isMulti || idx === 0 ? 1 : 0,
    pointerEvents: 'none',
    transform: isMulti ? MULTI_TRANSFORMS[idx] : SINGLE_TRANSFORM,
})

const Header = ({language, handleLanguageChange, activeBackend, handleBackendToggle}) => {
    const isMulti = activeBackend === 'multi_agent'

    return (
        <div className="flex justify-between items-center py-1 border-b-2 border-secondary">

        {/* Left — backend toggle */}
        <div className="w-1/3 flex items-center ml-3">
            <button
                onClick={handleBackendToggle}
                className="flex flex-col items-center gap-1.5 group"
            >
                {/* Robot box */}
                <div
                    className="relative border-2 bg-black bg-opacity-50 border-secondary border-opacity-50 rounded-md"
                    style={{ width: `${BOX}px`, height: `${BOX}px` }}
                >
                    <span style={robotStyle(isMulti, 0)}>🤖</span>
                    <span style={robotStyle(isMulti, 1)}>🤖</span>
                    <span style={robotStyle(isMulti, 2)}>🤖</span>
                </div>
                {/* Label */}
                <span className="text-[12px] text-black-text group-hover:text-tertiary transition-colors duration-200 leading-none">
                    {isMulti ? 'Multi Agent' : 'Single Agent'}
                </span>
            </button>
        </div>

        {/* Center — title */}
        <h1 className="text-center text-black-text text-2xl sm:text-3xl md:text-4xl w-1/3 font-mono">
            <Typewriter
                onInit={(typewriter) => {
                    typewriter.typeString('hacettepe')
                    .pauseFor(300)
                    .typeString('<strong style="color: #b72e2e;"> ai</strong>')
                    .start()
                }}
                options={{
                    delay: "150",
                    deleteSpeed: "natural",
                    cursor: "_",
                }}
            />
        </h1>

        {/* Right — language toggle */}
        <div className="w-1/3 flex justify-end items-center mr-3 text-base gap-2">
            <div
                className="relative flex items-center cursor-pointer w-14 sm:w-16 h-7 sm:h-8 bg-black rounded-full"
                onClick={handleLanguageChange}
            >
                <div
                    className={`absolute w-7 sm:w-8 h-7 sm:h-8 bg-secondary rounded-full transition-transform duration-300 ${
                        language === 'TR' ? 'translate-x-7 sm:translate-x-8' : 'translate-x-0'
                    }`}
                />
                <span className={`absolute left-1 sm:left-2 text-tertiary text-sm ${language === 'EN' ? 'font-bold' : 'text-opacity-50'}`}>
                    EN
                </span>
                <span className={`absolute right-1 sm:right-2 text-tertiary text-sm ${language === 'TR' ? 'font-bold' : 'text-opacity-50'}`}>
                    TR
                </span>
            </div>
        </div>

        </div>
    )
}

export default Header
