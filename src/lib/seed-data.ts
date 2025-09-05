import { ComicService } from './db-service';

export function seedDatabase() {
  try {
    const series1 = ComicService.createSeries({
      title: "Amazing Spider-Man",
      publisher: "Marvel Comics",
      startYear: 2018,
      description: "Spider-Man swings into a brand-new adventure!"
    });

    ComicService.createIssue({
      seriesId: series1.id,
      issueNumber: "1",
      title: "Amazing Spider-Man #1",
      releaseDate: "2018-04-03",
      coverDate: "2018-06",
      description: "Spider-Man swings into a brand-new adventure! Peter Parker has overcome many obstacles in his life, but nothing could prepare him for the challenges that lie ahead.",
      rating: 9.2,
      upc: "75960608936800111",
      inCollection: true
    });

    const series2 = ComicService.createSeries({
      title: "Batman",
      publisher: "DC Comics",
      startYear: 2016,
      description: "The Dark Knight returns in this ongoing series"
    });

    ComicService.createIssue({
      seriesId: series2.id,
      issueNumber: "1",
      title: "Batman #1",
      releaseDate: "2016-06-15",
      coverDate: "2016-08",
      inCollection: true
    });

    const series3 = ComicService.createSeries({
      title: "Hellboy",
      publisher: "Dark Horse Comics",
      startYear: 1994,
      description: "The World's Greatest Paranormal Investigator"
    });

    ComicService.createIssue({
      seriesId: series3.id,
      issueNumber: "1",
      title: "Hellboy: Seed of Destruction #1",
      releaseDate: "1994-03-01",
      coverDate: "1994-03",
      inCollection: true
    });

    const series4 = ComicService.createSeries({
      title: "Teenage Mutant Ninja Turtles",
      publisher: "IDW Publishing",
      startYear: 2011,
      description: "Heroes in a half shell"
    });

    ComicService.createIssue({
      seriesId: series4.id,
      issueNumber: "1",
      title: "TMNT #1",
      releaseDate: "2011-08-24",
      coverDate: "2011-10",
      inCollection: true
    });

    const series5 = ComicService.createSeries({
      title: "The Walking Dead",
      publisher: "Image Comics",
      startYear: 2003,
      endYear: 2019,
      description: "A zombie apocalypse survival story"
    });

    ComicService.createIssue({
      seriesId: series5.id,
      issueNumber: "1",
      title: "The Walking Dead #1",
      releaseDate: "2003-10-08",
      coverDate: "2003-10",
      inCollection: true
    });

    console.log('Database seeded successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}