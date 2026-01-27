export default function HowItWorks() {
  return (
    <section id="how-it-works" className="container py-8 md:py-12 lg:py-24">
      <div className="mx-auto flex max-w-[58rem] flex-col items-center justify-center gap-4 text-center">
        <h2 className="font-heading text-3xl leading-[1.1] sm:text-3xl md:text-6xl">
          How It Works
        </h2>
        <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
          Building your family tree is simple and intuitive.
        </p>
      </div>
      <div className="mx-auto grid justify-center gap-8 sm:grid-cols-2 md:max-w-[64rem] md:grid-cols-3 lg:gap-12 pt-8">
        <div className="flex flex-col items-center space-y-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-black dark:bg-white dark:text-black font-bold text-xl shadow-md">
            1
          </div>
          <h3 className="text-xl font-bold">Sign Up</h3>
          <p className="text-sm text-muted-foreground">
            Create an account to start your secure family tree journey.
          </p>
        </div>
        <div className="flex flex-col items-center space-y-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-black dark:bg-white dark:text-black font-bold text-xl shadow-md">
            2
          </div>
          <h3 className="text-xl font-bold">Add Members</h3>
          <p className="text-sm text-muted-foreground">
            Add family members with details like birth dates and photos.
          </p>
        </div>
        <div className="flex flex-col items-center space-y-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-black dark:bg-white dark:text-black font-bold text-xl shadow-md">
            3
          </div>
          <h3 className="text-xl font-bold">Connect & Visualize</h3>
          <p className="text-sm text-muted-foreground">
            Define relationships and watch your family tree grow instantly.
          </p>
        </div>
      </div>
    </section>
  );
}
