"use client";

export default function SuccessStories() {
  const items = [
    { src: "https://placehold.co/800x600?text=Success+1", alt: "Success story 1" },
    { src: "https://placehold.co/800x600?text=Success+2", alt: "Success story 2" },
    { src: "https://placehold.co/800x600?text=Success+3", alt: "Success story 3" },
    { src: "https://placehold.co/800x600?text=Success+4", alt: "Success story 4" },
  ];

  return (
    <section className="bg-white py-10 md:py-[100px]">
      <div className="w-full space-y-6 md:space-y-10 lg:space-y-12">
        {/* Header */}
        <div className="flex w-full flex-col items-start gap-3 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-2">
            <span className="w-fit rounded-full border-2 border-purple-100 bg-purple-50 px-4 py-1 text-sm font-semibold text-purple-600 md:text-[14px]">
              Success Stories
            </span>
            <h2 className="text-2xl font-extrabold leading-tight tracking-tight text-black md:text-4xl">
              Success Stories
            </h2>
          </div>
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-4">
          {items.map((item, idx) => (
            <figure key={idx} className="overflow-hidden rounded-2xl bg-gray-100">
              <img
                src={item.src}
                alt={item.alt}
                className="h-40 w-full object-cover transition-transform duration-300 hover:scale-105 md:h-48 lg:h-56"
                loading="lazy"
              />
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
